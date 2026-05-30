# GDPR Compliance Guide

## Right to Erasure — Article 17

### How Deletion Works

All erasure requests flow through the `DeletionRegistryService` (`src/gdpr/services/deletion-registry.service.ts`).
Every module that stores personal data **must** register a handler with this service on startup.
The registry executes all handlers inside a single database transaction, ensuring atomicity.

### Registering a New Module for Deletion

In your module's processor or service, inject `DeletionRegistryService` and call `register()` in `onModuleInit`:

```typescript
import { DeletionRegistryService } from '../gdpr/services/deletion-registry.service';

@Injectable()
export class MyService implements OnModuleInit {
  constructor(private readonly deletionRegistry: DeletionRegistryService) {}

  onModuleInit(): void {
    this.deletionRegistry.register({
      moduleName: 'my-module',
      deleteForUser: async (userId, manager) => {
        await manager.delete(MyEntity, { userId });
      },
    });
  }
}
```

### Currently Registered Modules

| Module | Action |
|--------|--------|
| `users` | Anonymises PII fields (name, email, phone, NPI, licence) |
| `patients` | Anonymises all patient demographic fields |
| `records` | Hard-deletes all Record rows for the patient |
| `medical-records` | Hard-deletes all MedicalRecord rows |
| `access-grants` | Revokes all active grants with reason "GDPR Right to Erasure" |
| `audit-logs` | Hard-deletes audit log entries for the user |

### Adding a New Entity — Checklist

1. Implement a deletion handler in your module's service/processor.
2. Call `DeletionRegistryService.register()` in `onModuleInit`.
3. Add a row to the table above in this document.
4. Verify `DeletionRegistryService.getRegisteredModules()` includes your module name.

### CI Enforcement

The `DeletionRegistryService.getRegisteredModules()` method returns the list of registered modules at runtime.
A future lint rule should assert that any `@Entity` class storing a `userId` or `patientId` column has a
corresponding registration call; until then the checklist above is the authoritative gate.

## Data Export — Article 15

Export jobs aggregate data from the same entity repositories used by the deletion pipeline and write a
timestamped JSON file to a temporary path before sending a download link to the user's registered email.

## Contact

Data Protection Officer: dpo@healthystellar.com
