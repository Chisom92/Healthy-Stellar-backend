import { Test, TestingModule } from '@nestjs/testing';
import { MedicalDataSanitizerService } from '../../src/common/validation/medical-data-sanitizer.service';
import { MedicalCodeValidatorService } from '../../src/common/validation/medical-code-validator.service';
import { EmergencyAlertValidator } from '../../src/common/validation/emergency-alert-validator';

describe('Medical Data Validation - Compliance Tests', () => {
  let sanitizer: MedicalDataSanitizerService;
  let codeValidator: MedicalCodeValidatorService;
  let emergencyValidator: EmergencyAlertValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalDataSanitizerService,
        MedicalCodeValidatorService,
        EmergencyAlertValidator
      ]
    }).compile();

    sanitizer = module.get<MedicalDataSanitizerService>(MedicalDataSanitizerService);
    codeValidator = module.get<MedicalCodeValidatorService>(MedicalCodeValidatorService);
    emergencyValidator = module.get<EmergencyAlertValidator>(EmergencyAlertValidator);
  });

  describe('Medical Code Validation', () => {
    it('should validate correct ICD-10 codes', () => {
      const result = codeValidator.validateICD10Code('E11');
      expect(result.valid).toBe(true);
      expect(result.description).toBeDefined();
    });

    it('should reject invalid ICD-10 codes', () => {
      const result = codeValidator.validateICD10Code('INVALID');
      expect(result.valid).toBe(false);
    });

    it('should validate correct CPT codes', () => {
      const result = codeValidator.validateCPTCode('99213');
      expect(result.valid).toBe(true);
      expect(result.description).toBeDefined();
    });

    it('should reject invalid CPT codes', () => {
      const result = codeValidator.validateCPTCode('ABC12');
      expect(result.valid).toBe(false);
    });

    it('should validate NDC codes', () => {
      const result = codeValidator.validateNDCCode('59310-001-16');
      expect(result).toBe(true);
    });
  });

  describe('Data Sanitization', () => {
    it('should remove HTML tags from text', () => {
      const malicious = '<script>alert("xss")</script>Clinical Note';
      const sanitized = sanitizer.sanitizeText(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should sanitize medical codes', () => {
      const code = 'e11.9';
      const sanitized = sanitizer.sanitizeCode(code);
      expect(sanitized).toBe('E11.9');
    });

    it('should sanitize MRN format', () => {
      const mrn = 'mrn-12345';
      const sanitized = sanitizer.sanitizeMRN(mrn);
      expect(sanitized).toBe('MRN-12345');
    });

    it('should sanitize email addresses', () => {
      const email = 'TEST@EXAMPLE.COM';
      const sanitized = sanitizer.sanitizeEmail(email);
      expect(sanitized).toBe('test@example.com');
    });

    it('should sanitize phone numbers', () => {
      const phone = '(555) 123-4567 ext 89<script>';
      const sanitized = sanitizer.sanitizePhoneNumber(phone);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should not expose sensitive PHI fields', () => {
      const obj = {
        name: 'John Doe',
        ssn: '123-45-6789',
        email: 'john@example.com'
      };
      const sanitized = sanitizer.sanitizeObject(obj);
      expect(sanitized.ssn).toBe('***REDACTED***');
      expect(sanitized.name).toBeDefined();
    });
  });

  describe('Emergency Alert Validation', () => {
    it('should detect emergency keywords', () => {
      const alert = emergencyValidator.validateAndProcessEmergencyAlert({
        patientId: 'patient-123',
        description: 'PATIENT EXPERIENCING SEVERE CHEST PAIN - MYOCARDIAL_INFARCTION',
        triggeredBy: 'provider-001'
      });

      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('CRITICAL');
    });

    it('should detect critical vitals', () => {
      const vitals = {
        heartRate: 150,
        systolicBP: 200,
        respiratoryRate: 8,
        oxygenSaturation: 80,
        temperature: 39
      };

      const isEmergency = emergencyValidator.isEmergencySituation(vitals);
      expect(isEmergency).toBe(true);
    });

    it('should not flag normal vitals as emergency', () => {
      const vitals = {
        heartRate: 72,
        systolicBP: 120,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        temperature: 37
      };

      const isEmergency = emergencyValidator.isEmergencySituation(vitals);
      expect(isEmergency).toBe(false);
    });
  });

  describe('HIPAA Compliance', () => {
    it('should not expose patient details in error messages', () => {
      const error = {
        patientId: 'patient-123',
        ssn: '123-45-6789',
        message: 'Validation failed'
      };

      const sanitized = sanitizer.sanitizeObject(error);
      expect(sanitized.ssn).toBe('***REDACTED***');
    });

    it('should limit text length to prevent storage issues', () => {
      const longText = 'a'.repeat(10000);
      const sanitized = sanitizer.sanitizeText(longText);
      expect(sanitized.length).toBeLessThanOrEqual(5000);
    });
  });
});
