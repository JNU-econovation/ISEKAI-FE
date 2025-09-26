/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';

import * as LAppDefine from './lappdefine';
import { LAppDelegate } from './lappdelegate';
import { LAppPal } from './lapppal';
import { LAppSprite } from './lappsprite';
import { TextureInfo } from './lapptexturemanager';
import { TouchManager } from './touchmanager';
import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 그림 수업.
 */
export class LAppView {
  /**
   * 생성자
   */
  public constructor() {
    this._programId = null;
    this._back = null;
    this._gear = null;

    // 관련 이벤트 관리를 터치합니다
    this._touchManager = new TouchManager();

    // 장치 좌표를 화면 좌표로 변환합니다
    this._deviceToScreen = new CubismMatrix44();

    // 화면 표시 및 이동을 변환하는 행렬
    this._viewMatrix = new CubismViewMatrix();
  }

  /**
   * 초기화.
   */
  public initialize(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
    const { width, height } = subdelegate.getCanvas();

    const ratio: number = width / height;
    const left: number = -ratio;
    const right: number = ratio;
    const bottom: number = LAppDefine.ViewLogicalLeft;
    const top: number = LAppDefine.ViewLogicalRight;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // デバイスに対応する画面の範囲。 Xの左端、Xの右端、Yの下端、Yの上端
    this._viewMatrix.scale(LAppDefine.ViewScale, LAppDefine.ViewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW: number = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH: number = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 디스플레이 범위를 설정합니다
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 限界拡張率
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 限界縮小率

    // 표시 할 수있는 최대 범위
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * 풀어 주다
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    this._gear.release();
    this._gear = null;

    this._back.release();
    this._back = null;

    this._subdelegate.getGlManager().getGl().deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * 그리다.
   */
  public render(): void {
    this._subdelegate.getGlManager().getGl().useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    this._subdelegate.getGlManager().getGl().flush();

    const lapplive2dmanager = this._subdelegate.getLive2DManager();
    if (lapplive2dmanager != null) {
      lapplive2dmanager.setViewMatrix(this._viewMatrix);

      lapplive2dmanager.onUpdate();
    }
  }

  /**
   * 이미지를 초기화하십시오.
   */
  public initializeSprite(): void {
    const width: number = this._subdelegate.getCanvas().width;
    const height: number = this._subdelegate.getCanvas().height;
    const textureManager = this._subdelegate.getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = '';

    // 배경 이미지 초기화
    imageName = LAppDefine.BackImageName;

    // 콜백 함수는 비동기식이므로 만듭니다
    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = textureInfo.width * 2.0;
      const fheight = height * 0.95;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
      this._back.setSubdelegate(this._subdelegate);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    // 기어 이미지 초기화
    imageName = LAppDefine.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
      this._gear.setSubdelegate(this._subdelegate);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );

    // 셰이더를 만듭니다
    if (this._programId == null) {
      this._programId = this._subdelegate.createShader();
    }
  }

  /**
   * 만질 때 호출.
   *
   * @param pointx 화면 x 좌표
   * @param 뾰족한 화면 Y 좌표
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(
      pointX * window.devicePixelRatio,
      pointY * window.devicePixelRatio
    );
  }

  /**
   * 접촉하는 동안 포인터가 움직이는 경우 호출됩니다.
   *
   * @param pointx 화면 x 좌표
   * @param 뾰족한 화면 Y 좌표
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio;
    const posY = pointY * window.devicePixelRatio;

    const lapplive2dmanager = this._subdelegate.getLive2DManager();

    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(posX, posY);

    lapplive2dmanager.onDrag(viewX, viewY);
  }

  /**
   * 터치가 끝나면 호출됩니다.
   *
   * @param pointx 화면 x 좌표
   * @param 뾰족한 화면 Y 좌표
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio;
    const posY = pointY * window.devicePixelRatio;

    const lapplive2dmanager = this._subdelegate.getLive2DManager();

    // 터치 끝
    lapplive2dmanager.onDrag(0.0, 0.0);

    // 단일 탭
    const x: number = this.transformViewX(posX);
    const y: number = this.transformViewY(posY);

    if (LAppDefine.DebugTouchLogEnable) {
      LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
    }
    lapplive2dmanager.onTap(x, y);

    // 기어를 탭 했습니까?
    if (this._gear.isHit(posX, posY)) {
      lapplive2dmanager.nextScene();
    }
  }

  /**
   * X 좌표를 변환하여 좌표를 봅니다.
   *
   * @param devicex devicex 좌표
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX); // 論理座標変換した座標を取得。
    return this._viewMatrix.invertTransformX(screenX); // 拡大、縮小、移動後の値。
  }

  /**
   * 좌표를 볼 수 있도록 Y 좌표를 변환합니다.
   *
   * @Param 장치 장치 y 좌표
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY); // 論理座標変換した座標を取得。
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * X 좌표를 화면 좌표로 변환합니다.
   * @param devicex devicex 좌표
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * y 좌표를 화면 좌표로 변환합니다.
   *
   * @Param 장치 장치 y 좌표
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // タッチマネージャー
  _deviceToScreen: CubismMatrix44; // デバイスからスクリーンへの行列
  _viewMatrix: CubismViewMatrix; // viewMatrix
  _programId: WebGLProgram; // シェーダID
  _back: LAppSprite; // 背景画像
  _gear: LAppSprite; // ギア画像
  _changeModel: boolean; // モデル切り替えフラグ
  _isClick: boolean; // クリック中
  private _subdelegate: LAppSubdelegate;
}
