// 인터페이스만 미리 잡아둠
export interface UploadService {
  uploadAndGetUrls(files: File[]): Promise<string[]>; // imageUrl[] 반환
}
