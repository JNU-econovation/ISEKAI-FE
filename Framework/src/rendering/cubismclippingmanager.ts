/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { Constant } from '../live2dcubismframework';
import { csmVector } from '../type/csmvector';
import { csmRect } from '../type/csmrectf';
import { CubismMatrix44 } from '../math/cubismmatrix44';
import { CubismModel } from '../model/cubismmodel';
import { CubismClippingContext, CubismTextureColor } from './cubismrenderer';
import { CubismLogError, CubismLogWarning } from '../utils/cubismdebug';

const ColorChannelCount = 4; // 실험 시 1채널인 경우 1, RGB만인 경우 3, 알파도 포함하는 경우 4
const ClippingMaskMaxCountOnDefault = 36; // 일반 프레임 버퍼당 최대 마스크 수
const ClippingMaskMaxCountOnMultiRenderTexture = 32; // 프레임 버퍼가 2개 이상 있는 경우 프레임 버퍼당 최대 마스크 수

export type ClippingContextConstructor<T_ClippingContext extends CubismClippingContext> = new (
  manager: CubismClippingManager<T_ClippingContext>,
  drawableMasks: Int32Array,
  drawableMaskCounts: number
) => T_ClippingContext;

export interface ICubismClippingManager {
  getClippingMaskBufferSize(): number;
}

export abstract class CubismClippingManager<T_ClippingContext extends CubismClippingContext> implements ICubismClippingManager {
  /**
   * 생성자
   */
  public constructor(
    clippingContextFactory: ClippingContextConstructor<T_ClippingContext>
  ) {
    this._renderTextureCount = 0;
    this._clippingMaskBufferSize = 256;
    this._clippingContextListForMask = new csmVector<T_ClippingContext>();
    this._clippingContextListForDraw = new csmVector<T_ClippingContext>();
    this._channelColors = new csmVector<CubismTextureColor>();
    this._tmpBoundsOnModel = new csmRect();
    this._tmpMatrix = new CubismMatrix44();
    this._tmpMatrixForMask = new CubismMatrix44();
    this._tmpMatrixForDraw = new CubismMatrix44();

    this._clippingContexttConstructor = clippingContextFactory;

    let tmp: CubismTextureColor = new CubismTextureColor();
    tmp.r = 1.0;
    tmp.g = 0.0;
    tmp.b = 0.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 1.0;
    tmp.b = 0.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 0.0;
    tmp.b = 1.0;
    tmp.a = 0.0;
    this._channelColors.pushBack(tmp);

    tmp = new CubismTextureColor();
    tmp.r = 0.0;
    tmp.g = 0.0;
    tmp.b = 0.0;
    tmp.a = 1.0;
    this._channelColors.pushBack(tmp);
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      if (this._clippingContextListForMask.at(i)) {
        this._clippingContextListForMask.at(i).release();
        this._clippingContextListForMask.set(i, void 0);
      }
      this._clippingContextListForMask.set(i, null);
    }
    this._clippingContextListForMask = null;

    // _clippingContextListForDraw는 _clippingContextListForMask에 있는 인스턴스를 가리키고 있습니다. 위 처리로 인해 요소별 DELETE는 필요 없습니다.
    for (let i = 0; i < this._clippingContextListForDraw.getSize(); i++) {
      this._clippingContextListForDraw.set(i, null);
    }
    this._clippingContextListForDraw = null;

    for (let i = 0; i < this._channelColors.getSize(); i++) {
      this._channelColors.set(i, null);
    }

    this._channelColors = null;

    if (this._clearedFrameBufferFlags != null) {
      this._clearedFrameBufferFlags.clear();
    }
    this._clearedFrameBufferFlags = null;
  }

  /**
   * 관리자 초기화 처리
   * 클리핑 마스크를 사용하는 그리기 개체의 등록을 수행합니다.
   * @param model 모델의 인스턴스
   * @param renderTextureCount 버퍼 생성 수
   */
  public initialize(model: CubismModel, renderTextureCount: number): void {
    // 렌더 텍스처의 총 개수 설정
    // 1 이상의 정수가 아닌 경우 각각 경고를 표시
    if (renderTextureCount % 1 != 0) {
      CubismLogWarning(
        'The number of render textures must be specified as an integer. The decimal point is rounded down and corrected to an integer.'
      );
      // 소수점 이하 제거
      renderTextureCount = ~~renderTextureCount;
    }
    if (renderTextureCount < 1) {
      CubismLogWarning(
        'The number of render textures must be an integer greater than or equal to 1. Set the number of render textures to 1.'
      );
    }
    // 음수 값이 사용된 경우 강제로 1개로 설정
    this._renderTextureCount = renderTextureCount < 1 ? 1 : renderTextureCount;

    this._clearedFrameBufferFlags = new csmVector<boolean>(
      this._renderTextureCount
    );

    // 클리핑 마스크를 사용하는 그리기 개체를 모두 등록
    // 클리핑 마스크는 일반적으로 몇 개 정도로 제한하여 사용하는 것으로 함
    for (let i = 0; i < model.getDrawableCount(); i++) {
      if (model.getDrawableMaskCounts()[i] <= 0) {
        // 클리핑 마스크가 사용되지 않은 아트메쉬 (대부분 사용 안 함)
        this._clippingContextListForDraw.pushBack(null);
        continue;
      }

      // 기존 ClipContext와 동일한지 확인
      let clippingContext: T_ClippingContext = this.findSameClip(
        model.getDrawableMasks()[i],
        model.getDrawableMaskCounts()[i]
      );
      if (clippingContext == null) {
        // 동일한 마스크가 없으면 생성
        clippingContext = new this._clippingContexttConstructor(
          this,
          model.getDrawableMasks()[i],
          model.getDrawableMaskCounts()[i]
        );
        this._clippingContextListForMask.pushBack(clippingContext);
      }

      clippingContext.addClippedDrawable(i);

      this._clippingContextListForDraw.pushBack(clippingContext);
    }
  }

  /**
   * 이미 마스크를 만들었는지 확인
   * 만들었다면 해당하는 클리핑 마스크의 인스턴스를 반환
   * 만들지 않았다면 NULL을 반환
   * @param drawableMasks 그리기 개체를 마스크하는 그리기 개체 목록
   * @param drawableMaskCounts 그리기 개체를 마스크하는 그리기 개체 수
   * @return 해당하는 클리핑 마스크가 있으면 인스턴스를 반환하고, 없으면 NULL을 반환
   */
  public findSameClip(
    drawableMasks: Int32Array,
    drawableMaskCounts: number
  ): T_ClippingContext {
    // 생성된 ClippingContext와 일치하는지 확인
    for (let i = 0; i < this._clippingContextListForMask.getSize(); i++) {
      const clippingContext: T_ClippingContext =
        this._clippingContextListForMask.at(i);
      const count: number = clippingContext._clippingIdCount;

      // 개수가 다르면 다른 것
      if (count != drawableMaskCounts) {
        continue;
      }

      let sameCount = 0;

      // 동일한 ID를 가지고 있는지 확인. 배열 수가 같으므로 일치하는 개수가 같으면 동일한 것을 가진 것으로 간주
      for (let j = 0; j < count; j++) {
        const clipId: number = clippingContext._clippingIdList[j];

        for (let k = 0; k < count; k++) {
          if (drawableMasks[k] == clipId) {
            sameCount++;
            break;
          }
        }
      }

      if (sameCount == count) {
        return clippingContext;
      }
    }

    return null; // 찾을 수 없음
  }

  /**
   * 고정밀 마스크 처리용 행렬을 계산합니다.
   * @param model 모델의 인스턴스
   * @param isRightHanded 처리가 오른손 좌표계인지 여부
   */
  public setupMatrixForHighPrecision(
    model: CubismModel,
    isRightHanded: boolean
  ): void {
    // 모든 클리핑 준비
    // 동일한 클립(여러 개인 경우 하나의 클립으로 묶음)을 사용하는 경우 한 번만 설정
    let usingClipCount = 0;
    for (
      let clipIndex = 0;
      clipIndex < this._clippingContextListForMask.getSize();
      clipIndex++
    ) {
      // 하나의 클리핑 마스크에 대해
      const cc: T_ClippingContext =
        this._clippingContextListForMask.at(clipIndex);

      // 이 클립을 사용하는 그리기 개체 그룹 전체를 둘러싸는 사각형을 계산
      this.calcClippedDrawTotalBounds(model, cc);

      if (cc._isUsing) {
        usingClipCount++; // 사용 중으로 카운트
      }
    }

    // 마스크 행렬 생성 처리
    if (usingClipCount > 0) {
      this.setupLayoutBounds(0);

      // 크기가 렌더 텍스처 수와 맞지 않으면 맞춤
      if (this._clearedFrameBufferFlags.getSize() != this._renderTextureCount) {
        this._clearedFrameBufferFlags.clear();
        for (let i = 0; i < this._renderTextureCount; i++) {
          this._clearedFrameBufferFlags.pushBack(false);
        }
      } else {
        // 마스크의 클리어 플래그를 매 프레임 시작 시 초기화
        for (let i = 0; i < this._renderTextureCount; i++) {
          this._clearedFrameBufferFlags.set(i, false);
        }
      }

      // 실제로 마스크를 생성
      // 모든 마스크를 어떻게 레이아웃하고 그릴지 결정하고 ClipContext, ClippedDrawContext에 저장
      for (
        let clipIndex = 0;
        clipIndex < this._clippingContextListForMask.getSize();
        clipIndex++
      ) {
        // --- 실제로 하나의 마스크를 그립니다 ---
        const clipContext: T_ClippingContext =
          this._clippingContextListForMask.at(clipIndex);
        const allClippedDrawRect: csmRect = clipContext._allClippedDrawRect; // 이 마스크를 사용하는 모든 그리기 개체의 논리적 좌표상 둘러싸는 사각형
        const layoutBoundsOnTex01 = clipContext._layoutBounds; // 이 안에 마스크를 넣습니다.
        const margin = 0.05;
        let scaleX = 0.0;
        let scaleY = 0.0;
        const ppu: number = model.getPixelsPerUnit();
        const maskPixelSize: number = clipContext
          .getClippingManager()
          .getClippingMaskBufferSize();
        const physicalMaskWidth: number =
          layoutBoundsOnTex01.width * maskPixelSize;
        const physicalMaskHeight:
          number = 
          layoutBoundsOnTex01.height * maskPixelSize;

        this._tmpBoundsOnModel.setRect(allClippedDrawRect);
        if (this._tmpBoundsOnModel.width * ppu > physicalMaskWidth) {
          this._tmpBoundsOnModel.expand(allClippedDrawRect.width * margin, 0.0);
          scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
        } else {
          scaleX = ppu / physicalMaskWidth;
        }

        if (this._tmpBoundsOnModel.height * ppu > physicalMaskHeight) {
          this._tmpBoundsOnModel.expand(
            0.0,
            allClippedDrawRect.height * margin
          );
          scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;
        } else {
          scaleY = ppu / physicalMaskHeight;
        }

        // 마스크 생성 시 사용할 행렬을 구합니다.
        this.createMatrixForMask(
          isRightHanded,
          layoutBoundsOnTex01,
          scaleX,
          scaleY
        );

        clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
        clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());
      }
    }
  }

  /**
   * 마스크 생성·그리기용 행렬을 생성합니다.
   * @param isRightHanded 좌표를 오른손 좌표계로 다룰지 지정
   * @param layoutBoundsOnTex01 마스크를 넣을 영역
   * @param scaleX 그리기 개체의 신축률
   * @param scaleY 그리기 개체의 신축률
   */
  public createMatrixForMask(
    isRightHanded: boolean,
    layoutBoundsOnTex01: csmRect,
    scaleX: number,
    scaleY: number
  ): void {
    this._tmpMatrix.loadIdentity();
    {
      // Layout0..1을 -1..1로 변환
      this._tmpMatrix.translateRelative(-1.0, -1.0);
      this._tmpMatrix.scaleRelative(2.0, 2.0);
    }
    {
      // view to Layout0..1
      this._tmpMatrix.translateRelative(
        layoutBoundsOnTex01.x,
        layoutBoundsOnTex01.y
      ); //new = [translate]
      this._tmpMatrix.scaleRelative(scaleX, scaleY); //new = [translate][scale]
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y
      ); //new = [translate][scale][translate]
    }
    // tmpMatrixForMask가 계산 결과
    this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());

    this._tmpMatrix.loadIdentity();
    {
      this._tmpMatrix.translateRelative(
        layoutBoundsOnTex01.x,
        layoutBoundsOnTex01.y * (isRightHanded ? -1.0 : 1.0)
      ); //new = [translate]
      this._tmpMatrix.scaleRelative(
        scaleX,
        scaleY * (isRightHanded ? -1.0 : 1.0)
      ); //new = [translate][scale]
      this._tmpMatrix.translateRelative(
        -this._tmpBoundsOnModel.x,
        -this._tmpBoundsOnModel.y
      ); //new = [translate][scale][translate]
    }

    this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
  }

  /**
   * 클리핑 컨텍스트를 배치하는 레이아웃
   * 지정된 수의 렌더 텍스처를 최대한 사용하여 마스크를 레이아웃합니다.
   * 마스크 그룹 수가 4 이하이면 RGBA 각 채널에 하나씩 마스크를 배치하고, 5 이상 6 이하이면 RGBA를 2,2,1,1로 배치합니다.
   *
   * @param usingClipCount 배치할 클리핑 컨텍스트 수
   */
  public setupLayoutBounds(usingClipCount: number): void {
    const useClippingMaskMaxCount =
      this._renderTextureCount <= 1
        ? ClippingMaskMaxCountOnDefault
        : ClippingMaskMaxCountOnMultiRenderTexture * this._renderTextureCount;

    if (usingClipCount <= 0 || usingClipCount > useClippingMaskMaxCount) {
      if (usingClipCount > useClippingMaskMaxCount) {
        // 마스크 제한 수 경고 표시
        CubismLogError(
          'not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}',
          usingClipCount - useClippingMaskMaxCount,
          this._renderTextureCount,
          usingClipCount
        );
      }
      // 이 경우 하나의 마스크 타겟을 매번 지우고 사용
      for (
        let index = 0;
        index < this._clippingContextListForMask.getSize();
        index++
      ) {
        const clipContext: T_ClippingContext =
          this._clippingContextListForMask.at(index);
        clipContext._layoutChannelIndex = 0; // 어차피 매번 지우므로 고정
        clipContext._layoutBounds.x = 0.0;
        clipContext._layoutBounds.y = 0.0;
        clipContext._layoutBounds.width = 1.0;
        clipContext._layoutBounds.height = 1.0;
        clipContext._bufferIndex = 0;
      }
      return;
    }

    // 렌더 텍스처가 1장이면 9분할 (최대 36장)
    const layoutCountMaxValue = this._renderTextureCount <= 1 ? 9 : 8;

    // 지정된 수의 렌더 텍스처를 최대한 사용하여 마스크를 레이아웃합니다 (기본값은 1).
    // 마스크 그룹 수가 4 이하이면 RGBA 각 채널에 하나씩 마스크를 배치하고, 5 이상 6 이하이면 RGBA를 2,2,1,1로 배치합니다.
    let countPerSheetDiv: number = usingClipCount / this._renderTextureCount; // 렌더 텍스처당 몇 개를 할당할 것인가.
    const reduceLayoutTextureCount:
      number = 
      usingClipCount % this._renderTextureCount; // 레이아웃 수를 1개 줄이는 렌더 텍스처 수 (이 수만큼의 렌더 텍스처가 대상).

    // 1장에 할당할 마스크 분할 수를 가져오기 위해 소수점 올림
    countPerSheetDiv = Math.ceil(countPerSheetDiv);

    // RGBA를 순서대로 사용
    let divCount: number = countPerSheetDiv / ColorChannelCount; // 1채널에 배치하는 기본 마스크
    const modCount: number = countPerSheetDiv % ColorChannelCount; // 나머지, 이 번호의 채널까지 하나씩 배분 (인덱스 아님)

    // 소수점 버림
    divCount = ~~divCount;

    // RGBA 각 채널을 준비 (0:R, 1:G, 2:B, 3:A)
    let curClipIndex = 0; // 순서대로 설정

    for (
      let renderTextureIndex = 0;
      renderTextureIndex < this._renderTextureCount;
      renderTextureIndex++
    ) {
      for (
        let channelIndex = 0;
        channelIndex < ColorChannelCount;
        channelIndex++
      ) {
        // 이 채널에 레이아웃할 수
        // NOTE: 레이아웃 수 = 1채널에 배치하는 기본 마스크 + 나머지 마스크를 놓는 채널이면 1개 추가
        let layoutCount: number = divCount + (channelIndex < modCount ? 1 : 0);

        // 레이아웃 수를 1개 줄일 경우 그것을 실행할 채널 결정
        // div가 0일 때 정상적인 인덱스 범위 내에 있도록 조정
        const checkChannelIndex = modCount + (divCount < 1 ? -1 : 0);

        // 이번이 대상 채널이고, 레이아웃 수를 1개 줄이는 렌더 텍스처가 있는 경우
        if (channelIndex == checkChannelIndex && reduceLayoutTextureCount > 0) {
          // 현재 렌더 텍스처가 대상 렌더 텍스처이면 레이아웃 수를 1개 줄입니다.
          layoutCount -= !(renderTextureIndex < reduceLayoutTextureCount)
            ? 1
            : 0;
        }

        // 분할 방법 결정
        if (layoutCount == 0) {
          // 아무것도 안 함
        } else if (layoutCount == 1) {
          // 모두 그대로 사용
          const clipContext: T_ClippingContext =
            this._clippingContextListForMask.at(curClipIndex++);
          clipContext._layoutChannelIndex = channelIndex;
          clipContext._layoutBounds.x = 0.0;
          clipContext._layoutBounds.y = 0.0;
          clipContext._layoutBounds.width = 1.0;
          clipContext._layoutBounds.height = 1.0;
          clipContext._bufferIndex = renderTextureIndex;
        } else if (layoutCount == 2) {
          for (let i = 0; i < layoutCount; i++) {
            let xpos: number = i % 2;

            // 소수점 버림
            xpos = ~~xpos;

            const cc: T_ClippingContext = this._clippingContextListForMask.at(
              curClipIndex++
            );
            cc._layoutChannelIndex = channelIndex;

            // UV를 2개로 분해하여 사용
            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = 0.0;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 1.0;
            cc._bufferIndex = renderTextureIndex;
          }
        } else if (layoutCount <= 4) {
          // 4분할하여 사용
          for (let i = 0; i < layoutCount; i++) {
            let xpos: number = i % 2;
            let ypos: number = i / 2;

            // 소수점 버림
            xpos = ~~xpos;
            ypos = ~~ypos;

            const cc = this._clippingContextListForMask.at(curClipIndex++);
            cc._layoutChannelIndex = channelIndex;

            cc._layoutBounds.x = xpos * 0.5;
            cc._layoutBounds.y = ypos * 0.5;
            cc._layoutBounds.width = 0.5;
            cc._layoutBounds.height = 0.5;
            cc._bufferIndex = renderTextureIndex;
          }
        } else if (layoutCount <= layoutCountMaxValue) {
          // 9분할하여 사용
          for (let i = 0; i < layoutCount; i++) {
            let xpos = i % 3;
            let ypos = i / 3;

            // 소수점 버림
            xpos = ~~xpos;
            ypos = ~~ypos;

            const cc: T_ClippingContext =
              this._clippingContextListForMask.at(curClipIndex++);
            cc._layoutChannelIndex = channelIndex;

            cc._layoutBounds.x = xpos / 3.0;
            cc._layoutBounds.y = ypos / 3.0;
            cc._layoutBounds.width = 1.0 / 3.0;
            cc._layoutBounds.height = 1.0 / 3.0;
            cc._bufferIndex = renderTextureIndex;
          }
        } else {
          // 마스크 제한 수를 초과한 경우 처리
          CubismLogError(
            'not supported mask count : {0}\n[Details] render texture count : {1}, mask count : {2}',
            usingClipCount - useClippingMaskMaxCount,
            this._renderTextureCount,
            usingClipCount
          );

          // SetupShaderProgram에서 오버 액세스가 발생하므로 임시로 숫자 입력
          // 물론 그리기 결과는 올바르지 않게 됨
          for (let index = 0; index < layoutCount; index++) {
            const cc: T_ClippingContext =
              this._clippingContextListForMask.at(curClipIndex++);

            cc._layoutChannelIndex = 0;

            cc._layoutBounds.x = 0.0;
            cc._layoutBounds.y = 0.0;
            cc._layoutBounds.width = 1.0;
            cc._layoutBounds.height = 1.0;
            cc._bufferIndex = 0;
          }
        }
      }
    }
  }

  /**
   * 마스크될 그리기 개체 그룹 전체를 둘러싸는 사각형(모델 좌표계)을 계산합니다.
   * @param model 모델의 인스턴스
   * @param clippingContext 클리핑 마스크의 컨텍스트
   */
  public calcClippedDrawTotalBounds(
    model: CubismModel,
    clippingContext: T_ClippingContext
  ): void {
    // 피클리핑 마스크(마스크될 그리기 개체)의 전체 사각형
    let clippedDrawTotalMinX: number = Number.MAX_VALUE;
    let clippedDrawTotalMinY: number = Number.MAX_VALUE;
    let clippedDrawTotalMaxX: number = Number.MIN_VALUE;
    let clippedDrawTotalMaxY: number = Number.MIN_VALUE;

    // 이 마스크가 실제로 필요한지 판정
    // 이 클리핑을 사용하는 '그리기 개체'가 하나라도 사용 가능하면 마스크를 생성해야 함
    const clippedDrawCount: number =
      clippingContext._clippedDrawableIndexList.length;

    for (
      let clippedDrawableIndex = 0;
      clippedDrawableIndex < clippedDrawCount;
      clippedDrawableIndex++
    ) {
      // 마스크를 사용하는 그리기 개체의 그려질 사각형을 구함
      const drawableIndex: number =
        clippingContext._clippedDrawableIndexList[clippedDrawableIndex];

      const drawableVertexCount:
        number = 
        model.getDrawableVertexCount(drawableIndex);
      const drawableVertexes: Float32Array =
        model.getDrawableVertices(drawableIndex);

      let minX: number = Number.MAX_VALUE;
      let minY: number = Number.MAX_VALUE;
      let maxX: number = -Number.MAX_VALUE;
      let maxY: number = -Number.MAX_VALUE;

      const loop: number = drawableVertexCount * Constant.vertexStep;
      for (
        let pi: number = Constant.vertexOffset;
        pi < loop;
        pi += Constant.vertexStep
      ) {
        const x: number = drawableVertexes[pi];
        const y: number = drawableVertexes[pi + 1];

        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (y > maxY) {
          maxY = y;
        }
      }

      // 유효한 점을 하나도 얻지 못했으므로 건너뛰기
      if (minX == Number.MAX_VALUE) {
        continue;
      }

      // 전체 사각형에 반영
      if (minX < clippedDrawTotalMinX) {
        clippedDrawTotalMinX = minX;
      }
      if (minY < clippedDrawTotalMinY) {
        clippedDrawTotalMinY = minY;
      }
      if (maxX > clippedDrawTotalMaxX) {
        clippedDrawTotalMaxX = maxX;
      }
      if (maxY > clippedDrawTotalMaxY) {
        clippedDrawTotalMaxY = maxY;
      }

      if (clippedDrawTotalMinX == Number.MAX_VALUE) {
        clippingContext._allClippedDrawRect.x = 0.0;
        clippingContext._allClippedDrawRect.y = 0.0;
        clippingContext._allClippedDrawRect.width = 0.0;
        clippingContext._allClippedDrawRect.height = 0.0;
        clippingContext._isUsing = false;
      } else {
        clippingContext._isUsing = true;
        const w: number = clippedDrawTotalMaxX - clippedDrawTotalMinX;
        const h: number = clippedDrawTotalMaxY - clippedDrawTotalMinY;
        clippingContext._allClippedDrawRect.x = clippedDrawTotalMinX;
        clippingContext._allClippedDrawRect.y = clippedDrawTotalMinY;
        clippingContext._allClippedDrawRect.width = w;
        clippingContext._allClippedDrawRect.height = h;
      }
    }
  }

  /**
   * 화면 그리기에 사용할 클리핑 마스크 목록을 가져옵니다.
   * @return 화면 그리기에 사용할 클리핑 마스크 목록
   */
  public getClippingContextListForDraw(): csmVector<T_ClippingContext> {
    return this._clippingContextListForDraw;
  }

  /**
   * 클리핑 마스크 버퍼 크기를 가져옵니다.
   * @return 클리핑 마스크 버퍼 크기
   */
  public getClippingMaskBufferSize(): number {
    return this._clippingMaskBufferSize;
  }

  /**
   * 이 버퍼의 렌더 텍스처 수를 가져옵니다.
   * @return 이 버퍼의 렌더 텍스처 수
   */
  public getRenderTextureCount(): number {
    return this._renderTextureCount;
  }

  /**
   * 컬러 채널(RGBA)의 플래그를 가져옵니다.
   * @param channelNo 컬러 채널(RGBA) 번호 (0:R, 1:G, 2:B, 3:A)
   */
  public getChannelFlagAsColor(channelNo: number): CubismTextureColor {
    return this._channelColors.at(channelNo);
  }

  /**
   * 클리핑 마스크 버퍼 크기를 설정합니다.
   * @param size 클리핑 마스크 버퍼 크기
   */
  public setClippingMaskBufferSize(size: number): void {
    this._clippingMaskBufferSize = size;
  }

  protected _clearedFrameBufferFlags: csmVector<boolean>; // 마스크의 클리어 플래그 배열

  protected _channelColors: csmVector<CubismTextureColor>;
  protected _clippingContextListForMask: csmVector<T_ClippingContext>; // 마스크용 클리핑 컨텍스트 목록
  protected _clippingContextListForDraw: csmVector<T_ClippingContext>; // 그리기용 클리핑 컨텍스트 목록
  protected _clippingMaskBufferSize: number; // 클리핑 마스크의 버퍼 크기 (초기값: 256)
  protected _renderTextureCount: number; // 생성할 렌더 텍스처 수

  protected _tmpMatrix: CubismMatrix44; // 마스크 계산용 행렬
  protected _tmpMatrixForMask: CubismMatrix44; // 마스크 계산용 행렬
  protected _tmpMatrixForDraw: CubismMatrix44; // 마스크 계산용 행렬
  protected _tmpBoundsOnModel: csmRect; // 마스크 배치 계산용 사각형

  protected _clippingContexttConstructor: ClippingContextConstructor<T_ClippingContext>;
}