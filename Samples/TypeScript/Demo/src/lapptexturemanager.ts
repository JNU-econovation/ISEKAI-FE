/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { csmVector, iterator } from '@framework/type/csmvector';
import { LAppGlManager } from './lappglmanager';

/**
 * 텍스처 관리 클래스
 * 이미지를로드하고 관리하는 클래스.
 */
export class LAppTextureManager {
  /**
   * 생성자
   */
  public constructor() {
    this._textures = new csmVector<TextureInfo>();
  }

  /**
   * 풀어 주다.
   */
  public release(): void {
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      this._glManager.getGl().deleteTexture(ite.ptr().id);
    }
    this._textures = null;
  }

  /**
   * 이미지 로딩
   *
   * @param filename 이미지 파일 파일 경로로드
   * @param usepremultiply 당신은 Pomult Processing을 활성화합니까?
   * @return 이미지 정보, 로딩이 실패하면 NULL
   */
  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void
  ): void {
    // 이미로드 된 텍스처를 검색합니다
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      if (
        ite.ptr().fileName == fileName &&
        ite.ptr().usePremultply == usePremultiply
      ) {
        // 두 번째로 캐시가 사용됩니다 (대기 시간 없음)
        // WebKit은 동일한 이미지의 Onload를 다시 호출하려면 Re-Instance가 필요합니다.
        // 詳細 ： https : //stackoverflow.com/a/5024181
        ite.ptr().img = new Image();
        ite
          .ptr()
          .img.addEventListener('load', (): void => callback(ite.ptr()), {
            passive: true
          });
        ite.ptr().img.src = fileName;
        return;
      }
    }

    // 데이터 온로드 트리거
    const img = new Image();
    img.addEventListener(
      'load',
      (): void => {
        // 텍스처 객체 생성
        const tex: WebGLTexture = this._glManager.getGl().createTexture();

        // 텍스처를 선택합니다
        this._glManager
          .getGl()
          .bindTexture(this._glManager.getGl().TEXTURE_2D, tex);

        // 텍스처에 픽셀을 씁니다
        this._glManager
          .getGl()
          .texParameteri(
            this._glManager.getGl().TEXTURE_2D,
            this._glManager.getGl().TEXTURE_MIN_FILTER,
            this._glManager.getGl().LINEAR_MIPMAP_LINEAR
          );
        this._glManager
          .getGl()
          .texParameteri(
            this._glManager.getGl().TEXTURE_2D,
            this._glManager.getGl().TEXTURE_MAG_FILTER,
            this._glManager.getGl().LINEAR
          );

        // 사악한 과정을 수행합니다
        if (usePremultiply) {
          this._glManager
            .getGl()
            .pixelStorei(
              this._glManager.getGl().UNPACK_PREMULTIPLY_ALPHA_WEBGL,
              1
            );
        }

        // 텍스처에 픽셀을 씁니다
        this._glManager
          .getGl()
          .texImage2D(
            this._glManager.getGl().TEXTURE_2D,
            0,
            this._glManager.getGl().RGBA,
            this._glManager.getGl().RGBA,
            this._glManager.getGl().UNSIGNED_BYTE,
            img
          );

        // mipmap을 생성합니다
        this._glManager
          .getGl()
          .generateMipmap(this._glManager.getGl().TEXTURE_2D);

        // 텍스처 바인드
        this._glManager
          .getGl()
          .bindTexture(this._glManager.getGl().TEXTURE_2D, null);

        const textureInfo: TextureInfo = new TextureInfo();
        if (textureInfo != null) {
          textureInfo.fileName = fileName;
          textureInfo.width = img.width;
          textureInfo.height = img.height;
          textureInfo.id = tex;
          textureInfo.img = img;
          textureInfo.usePremultply = usePremultiply;
          if (this._textures != null) {
            this._textures.pushBack(textureInfo);
          }
        }

        callback(textureInfo);
      },
      { passive: true }
    );
    img.src = fileName;
  }

  /**
   * 이미지 릴리스
   *
   * 배열의 모든 이미지를 해방합니다.
   */
  public releaseTextures(): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      this._glManager.getGl().deleteTexture(this._textures.at(i).id);
      this._textures.set(i, null);
    }

    this._textures.clear();
  }

  /**
   * 이미지 릴리스
   *
   * 지정된 텍스처의 이미지가 해방됩니다.
   * @param 텍스처 텍스처가 출시 될 예정입니다
   */
  public releaseTextureByTexture(texture: WebGLTexture): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).id != texture) {
        continue;
      }

      this._glManager.getGl().deleteTexture(this._textures.at(i).id);
      this._textures.set(i, null);
      this._textures.remove(i);
      break;
    }
  }

  /**
   * 이미지 릴리스
   *
   * 지정된 이름의 이미지를 해방합니다.
   * @param filename 이미지 파일 파일 경로 이름을 해제합니다.
   */
  public releaseTextureByFilePath(fileName: string): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).fileName == fileName) {
        this._glManager.getGl().deleteTexture(this._textures.at(i).id);
        this._textures.set(i, null);
        this._textures.remove(i);
        break;
      }
    }
  }

  /**
   * 세터
   * @param glmanager
   */
  public setGlManager(glManager: LAppGlManager): void {
    this._glManager = glManager;
  }

  _textures: csmVector<TextureInfo>;
  private _glManager: LAppGlManager;
}

/**
 * 이미지 정보 구조
 */
export class TextureInfo {
  img: HTMLImageElement; // 画像
  id: WebGLTexture = null; // テクスチャ
  width = 0; // 横幅
  height = 0; // 高さ
  usePremultply: boolean; // Premult処理を有効にするか
  fileName: string; // ファイル名
}
