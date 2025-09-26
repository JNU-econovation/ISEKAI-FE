/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { ACubismMotion } from '@framework/motion/acubismmotion';
import { csmVector } from '@framework/type/csmvector';

import * as LAppDefine from './lappdefine';
import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 샘플 애플리케이션에서 CubismModel을 관리하는 클래스
 * 모델을 생성 및 폐기하고, 탭 이벤트를 처리하며, 모델을 스위치하십시오.
 */
export class LAppLive2DManager {
  /**
   * 현재 장면에서 보관 된 모든 모델을 무료로 제공합니다
   */
  private releaseAllModel(): void {
    this._models.clear();
  }

  /**
   * 화면을 드래그 할 때 동작
   *
   * @param x x 화면의 좌표
   * @param y 화면 Y 좌표
   */
  public onDrag(x: number, y: number): void {
    const model: LAppModel = this._models.at(0);
    if (model) {
      model.setDragging(x, y);
    }
  }

  /**
   * 화면을 누를 때해야 할 일
   *
   * @param x x 화면의 좌표
   * @param y 화면 Y 좌표
   */
  public onTap(x: number, y: number): void {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    const model: LAppModel = this._models.at(0);

    if (model.hitTest(LAppDefine.HitAreaNameHead, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameHead}]`);
      }
      model.setRandomExpression();
    } else if (model.hitTest(LAppDefine.HitAreaNameBody, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameBody}]`);
      }
      model.startRandomMotion(
        LAppDefine.MotionGroupTapBody,
        LAppDefine.PriorityNormal,
        this.finishedMotion,
        this.beganMotion
      );
    }
  }

  /**
   * 화면을 업데이트 할 때해야 할 일
   * 모델 업데이트 및 도면 프로세스를 수행합니다
   */
  public onUpdate(): void {
    const { width, height } = this._subdelegate.getCanvas();

    const projection: CubismMatrix44 = new CubismMatrix44();
    const model: LAppModel = this._models.at(0);

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 수직 창에 긴 수평 모델을 표시 할 때 모델의 너비 크기에 따라 스케일을 계산합니다.
        model.getModelMatrix().setWidth(2.0);
        projection.scale(1.0, width / height);
      } else {
        projection.scale(height / width, 1.0);
      }

      // 필요한 경우 여기에 곱하십시오
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    model.update();
    model.draw(projection); // 参照渡しなのでprojectionは変質する。
  }

  /**
   *다음 장면으로 교체하십시오
   * 샘플 응용 프로그램이 모델 세트를 전환합니다.
   */
  public nextScene(): void {
    const no: number = (this._sceneIndex + 1) % LAppDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * 전환 장면
   * 샘플 응용 프로그램이 모델 세트를 전환합니다.
   * @param 색인
   */
  private changeScene(index: number): void {
    this._sceneIndex = index;

    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // modelDir []에서 보유한 디렉토리 이름에서
    // model3.json의 경로를 결정합니다.
    // 디렉토리 이름이 model3.json의 이름과 일치하는지 확인하십시오.
    const model: string = LAppDefine.ModelDir[index];
    const modelPath: string = LAppDefine.ResourcesPath + model + '/';
    let modelJsonName: string = LAppDefine.ModelDir[index];
    modelJsonName += '.model3.json';

    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);
    instance.loadAssets(modelPath, modelJsonName);
    this._models.pushBack(instance);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  /**
   * 모델 추가
   */
  public addModel(sceneIndex: number = 0): void {
    this._sceneIndex = sceneIndex;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 생성자
   */
  public constructor() {
    this._subdelegate = null;
    this._viewMatrix = new CubismMatrix44();
    this._models = new csmVector<LAppModel>();
    this._sceneIndex = 0;
  }

  /**
   * 풀어 주다.
   */
  public release(): void {}

  /**
   * 초기화.
   * @param subdelegate
   */
  public initialize(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 당신이 속한 세분화
   */
  private _subdelegate: LAppSubdelegate;

  _viewMatrix: CubismMatrix44; // モデル描画に用いるview行列
  _models: csmVector<LAppModel>; // モデルインスタンスのコンテナ
  private _sceneIndex: number; // 表示するシーンのインデックス値

  // 모션 재생을 시작하려면 콜백 함수
  beganMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Began:');
    console.log(self);
  };
  // 동작 재생 종료를위한 콜백 함수
  finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Finished:');
    console.log(self);
  };


  /**
   * 키보드 입력 처리
   */
  public onKeyDown(key: string): void {
    const model: LAppModel = this._models.at(0);
    
    if (!model) return;

    switch(key.toLowerCase()) {
      case 'e':
        // E키: 랜덤 표정
        model.setRandomExpression();
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage('[APP]Keyboard: Random Expression');
        }
        break;
        
      case 'm':
        // M키: 랜덤 바디 모션
        model.startRandomMotion(
          LAppDefine.MotionGroupTapBody,
          LAppDefine.PriorityNormal,
          this.finishedMotion,
          this.beganMotion
        );
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage('[APP]Keyboard: Random Motion');
        }
        break;
        
      case 'i':
        // I키: 아이들 모션
        model.startRandomMotion(
          LAppDefine.MotionGroupIdle,
          LAppDefine.PriorityNormal,
          this.finishedMotion,
          this.beganMotion
        );
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage('[APP]Keyboard: Idle Motion');
        }
        break;
        
      case 'n':
        // N키: 다음 모델
        this.nextScene();
        break;
        
      default:
        // 기타 키는 무시
        break;
    }
  }
}
