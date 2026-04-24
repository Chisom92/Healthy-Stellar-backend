import { Injectable, Logger } from '@nestjs/common';
import { MedicalCacheService } from './medical-cache.service';

/**
 * Cache Invalidation Service (Issue #449)
 *
 * Provides explicit, consistent invalidation strategies for all cached
 * clinical data domains. Callers must invoke the appropriate method
 * whenever the underlying data changes so that stale entries are never
 * served to clinicians.
 *
 * Invalidation strategies:
 *  - Entity-scoped  : invalidate all cache for a single patient / provider
 *  - Domain-scoped  : invalidate a clinical data category across all patients
 *  - Global         : full cache flush (emergency / schema-change scenarios)
 *  - Composite      : invalidate multiple related domains atomically
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private readonly cacheService: MedicalCacheService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Patient-scoped invalidation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Invalidate ALL cached data for a single patient.
   * Call after any write that touches patient records.
   */
  invalidatePatient(patientId: string): number {
    const count = this.cacheService.invalidateByTag(`patient:${patientId}`);
    this.logger.debug(`[patient:${patientId}] invalidated ${count} cache entries`);
    return count;
  }

  /**
   * Invalidate only the demographics cache for a patient.
   * Call after a demographics update (name, DOB, contact info).
   */
  invalidatePatientDemographics(patientId: string): void {
    this.cacheService.delete(`patient:demographics:${patientId}`);
    this.cacheService.delete(`patient:clinical-summary:${patientId}`);
    this.logger.debug(`[patient:${patientId}] demographics cache invalidated`);
  }

  /**
   * Invalidate allergy cache for a patient.
   * Call after allergy records are added, updated, or removed.
   * Also clears the clinical summary because it embeds allergy data.
   */
  invalidatePatientAllergies(patientId: string): void {
    this.cacheService.delete(`patient:allergies:${patientId}`);
    this.cacheService.delete(`patient:clinical-summary:${patientId}`);
    this.logger.warn(
      `[patient:${patientId}] allergy cache invalidated — clinical safety data updated`,
    );
  }

  /**
   * Invalidate medication cache for a patient.
   * Call after prescriptions are created, modified, or discontinued.
   * Also clears the clinical summary because it embeds medication data.
   */
  invalidatePatientMedications(patientId: string): void {
    this.cacheService.delete(`patient:medications:${patientId}`);
    this.cacheService.delete(`patient:clinical-summary:${patientId}`);
    this.logger.warn(
      `[patient:${patientId}] medication cache invalidated — clinical safety data updated`,
    );
  }

  /**
   * Invalidate vital signs cache for a patient.
   * Call after new vitals are recorded.
   */
  invalidatePatientVitals(patientId: string): void {
    this.cacheService.delete(`patient:vitals:${patientId}`);
    this.cacheService.delete(`patient:clinical-summary:${patientId}`);
    this.logger.debug(`[patient:${patientId}] vitals cache invalidated`);
  }

  /**
   * Invalidate lab results cache for a patient.
   * Call after new lab results are available.
   */
  invalidatePatientLabResults(patientId: string): void {
    this.cacheService.delete(`patient:labs:${patientId}`);
    this.cacheService.delete(`patient:clinical-summary:${patientId}`);
    this.logger.debug(`[patient:${patientId}] lab results cache invalidated`);
  }

  /**
   * Composite: invalidate all clinical-safety-critical caches for a patient
   * (allergies + medications + vitals + clinical summary).
   * Use when a medication administration or allergy reaction is recorded.
   */
  invalidateClinicalSafety(patientId: string): number {
    const keys = [
      `patient:allergies:${patientId}`,
      `patient:medications:${patientId}`,
      `patient:vitals:${patientId}`,
      `patient:clinical-summary:${patientId}`,
    ];
    let count = 0;
    for (const key of keys) {
      if (this.cacheService.delete(key)) count++;
    }
    this.logger.warn(
      `[patient:${patientId}] clinical-safety cache invalidated (${count} entries)`,
    );
    return count;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Domain-scoped invalidation (cross-patient)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Invalidate all allergy caches across all patients.
   * Use when a global formulary or allergy-code update is deployed.
   */
  invalidateAllAllergyCaches(): number {
    const count = this.cacheService.invalidateByTag('allergies');
    this.logger.warn(`Global allergy cache invalidated (${count} entries)`);
    return count;
  }

  /**
   * Invalidate all medication caches across all patients.
   * Use after a drug formulary update or drug-interaction database refresh.
   */
  invalidateAllMedicationCaches(): number {
    const count = this.cacheService.invalidateByTag('medications');
    this.logger.warn(`Global medication cache invalidated (${count} entries)`);
    return count;
  }

  /**
   * Invalidate all drug-interaction reference data.
   * Use after the drug-interaction database is updated.
   */
  invalidateDrugInteractionCache(): void {
    this.cacheService.invalidateByPattern('^drug-interactions');
    this.logger.warn('Drug-interaction reference cache invalidated');
  }

  /**
   * Invalidate all ICD-code reference data.
   * Use after an ICD code set update.
   */
  invalidateIcdCodeCache(): void {
    this.cacheService.invalidateByPattern('^icd-codes');
    this.logger.warn('ICD-code reference cache invalidated');
  }

  /**
   * Invalidate all bed-availability caches.
   * Use after a bulk bed-status update (e.g., ward reconfiguration).
   */
  invalidateBedAvailabilityCache(): number {
    const count = this.cacheService.invalidateByTag('bed-availability');
    this.logger.debug(`Bed-availability cache invalidated (${count} entries)`);
    return count;
  }

  /**
   * Invalidate all appointment-slot caches.
   * Use after a provider schedule change.
   */
  invalidateAppointmentSlotCache(): number {
    const count = this.cacheService.invalidateByPattern('^appointment-slots');
    this.logger.debug(`Appointment-slot cache invalidated (${count} entries)`);
    return count;
  }

  /**
   * Invalidate all dashboard / analytics caches.
   * Use after a bulk data import or report regeneration.
   */
  invalidateDashboardCaches(): number {
    const count = this.cacheService.invalidateByTag('dashboard');
    this.logger.debug(`Dashboard cache invalidated (${count} entries)`);
    return count;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Provider-scoped invalidation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Invalidate all caches tagged for a specific provider.
   * Use after provider profile or schedule changes.
   */
  invalidateProvider(providerId: string): number {
    const count = this.cacheService.invalidateByTag(`provider:${providerId}`);
    this.logger.debug(`[provider:${providerId}] invalidated ${count} cache entries`);
    return count;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Global / emergency invalidation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Flush the entire cache.
   * Use only in emergency scenarios (e.g., data-integrity incident) or
   * immediately after a schema migration that changes cached shapes.
   */
  invalidateAll(): void {
    this.cacheService.clear();
    this.logger.warn('FULL cache flush executed');
  }

  /**
   * Invalidate all clinical-safety caches across all patients.
   * Use after a system-wide drug-interaction or allergy-code update.
   */
  invalidateAllClinicalSafetyCaches(): number {
    const count = this.cacheService.invalidateByTag('clinical-safety');
    this.logger.warn(`All clinical-safety caches invalidated (${count} entries)`);
    return count;
  }
}
