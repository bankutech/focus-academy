import { beforeEach } from 'vitest';
import { setVerifiedAdmin } from '../src/services/adminIdentity';

beforeEach(() => {
  setVerifiedAdmin({ email: 'director@focusacademyperambalur.com', displayName: 'Director' });
});
