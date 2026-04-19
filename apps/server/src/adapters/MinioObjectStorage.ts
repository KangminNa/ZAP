import type { Client as MinioClient } from 'minio';
import type { Session } from '../domain/Session';
import type { ObjectStorage } from '../ports/ObjectStorage';

export class MinioObjectStorage implements ObjectStorage {
  constructor(
    private readonly internal: MinioClient,
    private readonly publicClient: MinioClient,
    private readonly bucket: string,
  ) {}

  async issueUploadUrls(
    session: Session,
    expirySeconds: number,
  ): Promise<string[]> {
    return Promise.all(
      session.files.map((file) =>
        this.publicClient.presignedPutObject(
          this.bucket,
          session.storageKeyFor(file),
          expirySeconds,
        ),
      ),
    );
  }

  async issueDownloadUrls(
    session: Session,
    expirySeconds: number,
  ): Promise<string[]> {
    return Promise.all(
      session.files.map((file) =>
        this.publicClient.presignedGetObject(
          this.bucket,
          session.storageKeyFor(file),
          expirySeconds,
        ),
      ),
    );
  }

  async deleteBySession(session: Session): Promise<void> {
    const keys = session.files.map((f) => session.storageKeyFor(f));
    await this.internal.removeObjects(this.bucket, keys);
  }
}
