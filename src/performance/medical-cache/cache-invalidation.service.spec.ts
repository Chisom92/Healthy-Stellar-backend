import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationService } from './cache-invalidation.service';
import { MedicalCacheService } from './medical-cache.service';

const mockCacheService = {
  delete: jest.fn(),
  invalidateByTag: jest.fn(),
  invalidateByPattern: jest.fn(),
  clear: jest.fn(),
};

describe('CacheInvalidationService', () => {
  let service: CacheInvalidationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCacheService.delete.mockReturnValue(true);
    mockCacheService.invalidateByTag.mockReturnValue(3);
    mockCacheService.invalidateByPattern.mockReturnValue(2);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        { provide: MedicalCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get(CacheInvalidationService);
  });

  // ── Patient-scoped ──────────────────────────────────────────────────────

  describe('invalidatePatient', () => {
    it('invalidates all entries tagged for the patient', () => {
      const count = service.invalidatePatient('p1');
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('patient:p1');
      expect(count).toBe(3);
    });
  });

  describe('invalidatePatientDemographics', () => {
    it('deletes demographics and clinical-summary keys', () => {
      service.invalidatePatientDemographics('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:demographics:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
    });
  });

  describe('invalidatePatientAllergies', () => {
    it('deletes allergy and clinical-summary keys', () => {
      service.invalidatePatientAllergies('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:allergies:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
    });
  });

  describe('invalidatePatientMedications', () => {
    it('deletes medication and clinical-summary keys', () => {
      service.invalidatePatientMedications('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:medications:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
    });
  });

  describe('invalidatePatientVitals', () => {
    it('deletes vitals and clinical-summary keys', () => {
      service.invalidatePatientVitals('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:vitals:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
    });
  });

  describe('invalidatePatientLabResults', () => {
    it('deletes lab and clinical-summary keys', () => {
      service.invalidatePatientLabResults('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:labs:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
    });
  });

  describe('invalidateClinicalSafety', () => {
    it('deletes all four clinical-safety keys and returns count', () => {
      const count = service.invalidateClinicalSafety('p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:allergies:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:medications:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:vitals:p1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('patient:clinical-summary:p1');
      expect(count).toBe(4);
    });

    it('counts only keys that were actually deleted', () => {
      mockCacheService.delete.mockReturnValueOnce(true).mockReturnValue(false);
      const count = service.invalidateClinicalSafety('p1');
      expect(count).toBe(1);
    });
  });

  // ── Domain-scoped ───────────────────────────────────────────────────────

  describe('invalidateAllAllergyCaches', () => {
    it('invalidates by allergies tag', () => {
      const count = service.invalidateAllAllergyCaches();
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('allergies');
      expect(count).toBe(3);
    });
  });

  describe('invalidateAllMedicationCaches', () => {
    it('invalidates by medications tag', () => {
      const count = service.invalidateAllMedicationCaches();
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('medications');
      expect(count).toBe(3);
    });
  });

  describe('invalidateDrugInteractionCache', () => {
    it('invalidates by drug-interactions pattern', () => {
      service.invalidateDrugInteractionCache();
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith('^drug-interactions');
    });
  });

  describe('invalidateIcdCodeCache', () => {
    it('invalidates by icd-codes pattern', () => {
      service.invalidateIcdCodeCache();
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith('^icd-codes');
    });
  });

  describe('invalidateBedAvailabilityCache', () => {
    it('invalidates by bed-availability tag', () => {
      const count = service.invalidateBedAvailabilityCache();
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('bed-availability');
      expect(count).toBe(3);
    });
  });

  describe('invalidateDashboardCaches', () => {
    it('invalidates by dashboard tag', () => {
      const count = service.invalidateDashboardCaches();
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('dashboard');
      expect(count).toBe(3);
    });
  });

  // ── Provider-scoped ─────────────────────────────────────────────────────

  describe('invalidateProvider', () => {
    it('invalidates all entries tagged for the provider', () => {
      const count = service.invalidateProvider('dr1');
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('provider:dr1');
      expect(count).toBe(3);
    });
  });

  // ── Global ──────────────────────────────────────────────────────────────

  describe('invalidateAll', () => {
    it('calls cacheService.clear()', () => {
      service.invalidateAll();
      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe('invalidateAllClinicalSafetyCaches', () => {
    it('invalidates by clinical-safety tag', () => {
      const count = service.invalidateAllClinicalSafetyCaches();
      expect(mockCacheService.invalidateByTag).toHaveBeenCalledWith('clinical-safety');
      expect(count).toBe(3);
    });
  });
});
