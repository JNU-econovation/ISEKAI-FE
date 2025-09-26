/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

/**
 * Cubism SDK 샘플에 사용 된 WebGL을 관리하는 클래스
 */
export class LAppGlManager {
  public constructor() {
    this._gl = null;
  }

  public initialize(canvas: HTMLCanvasElement): boolean {
    // GL 컨텍스트 초기화
    this._gl = canvas.getContext('webgl2');

    if (!this._gl) {
      // gl 初期化失敗
      alert('Cannot initialize WebGL. This browser does not support.');
      this._gl = null;
      // document.body.innerhtml =
      // '이 브라우저는 <code> & lt; canvas & gt; </code> 요소를 지원하지 않습니다.';
      return false;
    }
    return true;
  }

  /**
   * 풀어 주다.
   */
  public release(): void {}

  public getGl(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._gl;
  }

  private _gl: WebGLRenderingContext | WebGL2RenderingContext = null;
}
