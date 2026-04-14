import type { Session } from '../domain/Session';

export interface ObjectStorage {
  issueUploadUrls(session: Session, expirySeconds: number): Promise<string[]>;
  issueDownloadUrls(session: Session, expirySeconds: number): Promise<string[]>;
  deleteBySession(session: Session): Promise<void>;
}
