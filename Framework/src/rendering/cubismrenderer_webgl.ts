/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismModel } from '../model/cubismmodel';
import { csmMap } from '../type/csmmap';
import { csmRect } from '../type/csmrectf';
import { csmVector } from '../type/csmvector';
import { CubismLogError } from '../utils/cubismdebug';
import { CubismClippingManager } from './cubismclippingmanager';
import { CubismClippingContext, CubismRenderer } from './cubismrenderer';
import { CubismShaderManager_WebGL } from './cubismshader_webgl';

let s_viewport: number[];
let s_fbo: WebGLFramebuffer;

/**
 * 클리핑 마스크 처리를 실행하는 클래스
 */
export class CubismClippingManager_WebGL extends CubismClippingManager<CubismClippingContext_WebGL> {
  /**
   * 임시 렌더 텍스처의 주소를 가져옵니다.
   * FrameBufferObject가 없으면 새로 생성합니다.
   *
   * @return 렌더 텍스처의 배열
   */
  public getMaskRenderTexture(): csmVector<WebGLFramebuffer> {
    // 임시 RenderTexture를 가져옵니다.
    if (this._maskTexture && this._maskTexture.textures != null) {
      // 이전에 사용한 것을 반환
      this._maskTexture.frameNo = this._currentFrameNo;
    } else {
      // FrameBufferObject가 없으면 새로 생성
      if (this._maskRenderTextures != null) {
        this._maskRenderTextures.clear();
      }
      this._maskRenderTextures = new csmVector<WebGLFramebuffer>();

      // ColorBufferObject가 없으면 새로 생성
      if (this._maskColorBuffers != null) {
        this._maskColorBuffers.clear();
      }
      this._maskColorBuffers = new csmVector<WebGLTexture>();

      // 클리핑 버퍼 크기 가져오기
      const size: number = this._clippingMaskBufferSize;

      for (let index = 0; index < this._renderTextureCount; index++) {
        this._maskColorBuffers.pushBack(this.gl.createTexture()); // 직접 대입
        this.gl.bindTexture(
          this.gl.TEXTURE_2D,
          this._maskColorBuffers.at(index)
        );
        this.gl.texImage2D(
          this.gl.TEXTURE_2D,
          0,
          this.gl.RGBA,
          size,
          size,
          0,
          this.gl.RGBA,
          this.gl.UNSIGNED_BYTE,
          null
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_S,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_WRAP_T,
          this.gl.CLAMP_TO_EDGE
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MIN_FILTER,
          this.gl.LINEAR
        );
        this.gl.texParameteri(
          this.gl.TEXTURE_2D,
          this.gl.TEXTURE_MAG_FILTER,
          this.gl.LINEAR
        );
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

        this._maskRenderTextures.pushBack(this.gl.createFramebuffer());
        this.gl.bindFramebuffer(
          this.gl.FRAMEBUFFER,
          this._maskRenderTextures.at(index)
        );
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0,
          this.gl.TEXTURE_2D,
          this._maskColorBuffers.at(index),
          0
        );
      }
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo);

      this._maskTexture = new CubismRenderTextureResource(
        this._currentFrameNo,
        this._maskRenderTextures
      );
    }

    return this._maskTexture.textures;
  }

  /**
   * WebGL 렌더링 컨텍스트를 설정합니다.
   * @param gl WebGL 렌더링 컨텍스트
   */
  public setGL(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  /**
   * 생성자
   */
  public constructor() {
    super(CubismClippingContext_WebGL);
  }

  /**
   * 클리핑 컨텍스트를 생성합니다. 모델을 그릴 때 실행합니다.
   * @param model 모델의 인스턴스
   * @param renderer 렌더러의 인스턴스
   */
  public setupClippingContext(
    model: CubismModel,
    renderer: CubismRenderer_WebGL
  ): void {
    this._currentFrameNo++;

    // 모든 클리핑 준비
    // 동일한 클립(여러 개인 경우 하나의 클립으로 묶음)을 사용하는 경우 한 번만 설정
    let usingClipCount = 0;
    for (
      let clipIndex = 0;
      clipIndex < this._clippingContextListForMask.getSize();
      clipIndex++
    ) {
      // 하나의 클리핑 마스크에 대해
      const cc: CubismClippingContext_WebGL =
        this._clippingContextListForMask.at(clipIndex);

      // 이 클립을 사용하는 그리기 개체 그룹 전체를 둘러싸는 사각형을 계산
      this.calcClippedDrawTotalBounds(model, cc);

      if (cc._isUsing) {
        usingClipCount++; // 사용 중으로 카운트
      }
    }

    // 마스크 생성 처리
    if (usingClipCount > 0) {
      // 생성된 FrameBuffer와 동일한 크기로 뷰포트 설정
      this.gl.viewport(
        0,
        0,
        this._clippingMaskBufferSize,
        this._clippingMaskBufferSize
      );

      // 나중 계산을 위해 인덱스의 시작을 설정
      this._currentMaskRenderTexture = this.getMaskRenderTexture().at(0);

      renderer.preDraw(); // 버퍼를 지웁니다.

      this.setupLayoutBounds(usingClipCount);

      // ---------- 마스크 그리기 처리 ----------
      // 마스크용 RenderTexture를 active로 설정
      this.gl.bindFramebuffer(
        this.gl.FRAMEBUFFER,
        this._currentMaskRenderTexture
      );

      // 크기가 렌더 텍스처 수와 맞지 않으면 맞춤
      if (this._clearedFrameBufferFlags.getSize() != this._renderTextureCount) {
        this._clearedFrameBufferFlags.clear();
        this._clearedFrameBufferFlags = new csmVector<boolean>(
          this._renderTextureCount
        );
      }

      // 마스크의 클리어 플래그를 매 프레임 시작 시 초기화
      for (
        let index = 0;
        index < this._clearedFrameBufferFlags.getSize();
        index++
      ) {
        this._clearedFrameBufferFlags.set(index, false);
      }

      // 실제로 마스크를 생성
      // 모든 마스크를 어떻게 레이아웃하고 그릴지 결정하고 ClipContext, ClippedDrawContext에 저장
      for (
        let clipIndex = 0;
        clipIndex < this._clippingContextListForMask.getSize();
        clipIndex++
      ) {
        // --- 실제로 하나의 마스크를 그립니다 ---
        const clipContext: CubismClippingContext_WebGL =
          this._clippingContextListForMask.at(clipIndex);
        const allClipedDrawRect: csmRect = clipContext._allClippedDrawRect; // 이 마스크를 사용하는 모든 그리기 개체의 논리적 좌표상 둘러싸는 사각형
        const layoutBoundsOnTex01: csmRect = clipContext._layoutBounds; // 이 안에 마스크를 넣습니다.
        const margin = 0.05; // 모델 좌표상의 사각형을 적절히 여백을 주어 사용
        let scaleX = 0;
        let scaleY = 0;

        // clipContext에 설정한 렌더 텍스처를 인덱스로 가져오기
        const clipContextRenderTexture = this.getMaskRenderTexture().at(
          clipContext._bufferIndex
        );

        // 현재 렌더 텍스처가 clipContext의 것과 다른 경우
        if (this._currentMaskRenderTexture != clipContextRenderTexture) {
          this._currentMaskRenderTexture = clipContextRenderTexture;
          renderer.preDraw(); // 버퍼를 지웁니다.
          // 마스크용 RenderTexture를 active로 설정
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            this._currentMaskRenderTexture
          );
        }

        this._tmpBoundsOnModel.setRect(allClipedDrawRect);
        this._tmpBoundsOnModel.expand(
          allClipedDrawRect.width * margin,
          allClipedDrawRect.height * margin
        );
        //########## 원래는 할당된 영역 전체를 사용하지 않고 최소한의 크기가 좋음

        // 셰이더용 계산식을 구합니다. 회전을 고려하지 않는 경우는 다음과 같습니다.
        // movePeriod' = movePeriod * scaleX + offX		  [[ movePeriod' = (movePeriod - tmpBoundsOnModel.movePeriod)*scale + layoutBoundsOnTex01.movePeriod ]]
        scaleX = layoutBoundsOnTex01.width / this._tmpBoundsOnModel.width;
        scaleY = layoutBoundsOnTex01.height / this._tmpBoundsOnModel.height;

        // 마스크 생성 시 사용할 행렬을 구합니다.
        {
          // 셰이더에 전달할 행렬을 구합니다 <<<<<<<<<<<<<<<<<<<<<<<< 최적화 필요 (역순으로 계산하면 간단해짐)
          this._tmpMatrix.loadIdentity();
          {
            // layout0..1을 -1..1로 변환
            this._tmpMatrix.translateRelative(-1.0, -1.0);
            this._tmpMatrix.scaleRelative(2.0, 2.0);
          }
          {
            // view to layout0..1
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY); // new = [translate][scale]
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
            // new = [translate][scale][translate]
          }
          // tmpMatrixForMask가 계산 결과
          this._tmpMatrixForMask.setMatrix(this._tmpMatrix.getArray());
        }

        //---------	 draw 시 mask 참조용 행렬 계산
        {
          // 셰이더에 전달할 행렬을 구합니다 <<<<<<<<<<<<<<<<<<<<<<<< 최적화 필요 (역순으로 계산하면 간단해짐)
          this._tmpMatrix.loadIdentity();
          {
            this._tmpMatrix.translateRelative(
              layoutBoundsOnTex01.x,
              layoutBoundsOnTex01.y
            );
            this._tmpMatrix.scaleRelative(scaleX, scaleY); // new = [translate][scale]
            this._tmpMatrix.translateRelative(
              -this._tmpBoundsOnModel.x,
              -this._tmpBoundsOnModel.y
            );
            // new = [translate][scale][translate]
          }
          this._tmpMatrixForDraw.setMatrix(this._tmpMatrix.getArray());
        }
        clipContext._matrixForMask.setMatrix(this._tmpMatrixForMask.getArray());
        clipContext._matrixForDraw.setMatrix(this._tmpMatrixForDraw.getArray());

        const clipDrawCount: number = clipContext._clippingIdCount;
        for (let i = 0; i < clipDrawCount; i++) {
          const clipDrawIndex: number = clipContext._clippingIdList[i];

          // 정점 정보가 업데이트되지 않아 신뢰할 수 없는 경우 그리기를 건너뜁니다.
          if (
            !model.getDrawableDynamicFlagVertexPositionsDidChange(clipDrawIndex)
          ) {
            continue;
          }

          renderer.setIsCulling(
            model.getDrawableCulling(clipDrawIndex) != false
          );

          // 마스크가 지워지지 않았으면 처리
          if (!this._clearedFrameBufferFlags.at(clipContext._bufferIndex)) {
            // 마스크를 지웁니다.
            // (임시 사양) 1은 비활성(그려지지 않음) 영역, 0은 활성(그려짐) 영역. (셰이더 Cd*Cs로 0에 가까운 값을 곱하여 마스크를 만듭니다. 1을 곱하면 아무 일도 일어나지 않습니다.)
            this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this._clearedFrameBufferFlags.set(clipContext._bufferIndex, true);
          }

          // 이번 전용 변환을 적용하여 그립니다.
          // 채널도 전환해야 함(A,R,G,B)
          renderer.setClippingContextBufferForMask(clipContext);

          renderer.drawMeshWebGL(model, clipDrawIndex);
        }
      }

      // --- 후처리 ---
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo); // 그리기 대상을 되돌립니다.
      renderer.setClippingContextBufferForMask(null);

      this.gl.viewport(
        s_viewport[0],
        s_viewport[1],
        s_viewport[2],
        s_viewport[3]
      );
    }
  }

  /**
   * 컬러 버퍼를 가져옵니다.
   * @return 컬러 버퍼
   */
  public getColorBuffer(): csmVector<WebGLTexture> {
    return this._maskColorBuffers;
  }

  /**
   * 마스크의 총 수를 셉니다.
   * @returns
   */
  public getClippingMaskCount(): number {
    return this._clippingContextListForMask.getSize();
  }

  public _currentMaskRenderTexture: WebGLFramebuffer; // 마스크용 렌더 텍스처 주소
  public _maskRenderTextures: csmVector<WebGLFramebuffer>; // 렌더 텍스처 목록
  public _maskColorBuffers: csmVector<WebGLTexture>; // 마스크용 컬러 버퍼 주소 목록
  public _currentFrameNo: number; // 마스크 텍스처에 부여할 프레임 번호

  public _maskTexture: CubismRenderTextureResource; // 마스크용 텍스처 리소스 목록

  gl: WebGLRenderingContext; // WebGL 렌더링 컨텍스트
}

/**
 * 렌더 텍스처의 리소스를 정의하는 구조체
 * 클리핑 마스크에서 사용합니다.
 */
export class CubismRenderTextureResource {
  /**
   * 인자 있는 생성자
   * @param frameNo 렌더러의 프레임 번호
   * @param texture 텍스처 주소
   */
  public constructor(frameNo: number, texture: csmVector<WebGLFramebuffer>) {
    this.frameNo = frameNo;
    this.textures = texture;
  }

  public frameNo: number; // 렌더러의 프레임 번호
  public textures: csmVector<WebGLFramebuffer>; // 텍스처 주소
}

/**
 * 클리핑 마스크 컨텍스트
 */
export class CubismClippingContext_WebGL extends CubismClippingContext {
  /**
   * 인자 있는 생성자
   */
  public constructor(
    manager: CubismClippingManager_WebGL,
    clippingDrawableIndices: Int32Array,
    clipCount: number
  ) {
    super(clippingDrawableIndices, clipCount);
    this._owner = manager;
  }

  /**
   * 이 마스크를 관리하는 관리자 인스턴스를 가져옵니다.
   * @return 클리핑 매니저의 인스턴스
   */
  public getClippingManager(): CubismClippingManager_WebGL {
    return this._owner;
  }

  public setGl(gl: WebGLRenderingContext): void {
    this._owner.setGL(gl);
  }

  private _owner: CubismClippingManager_WebGL; // 이 마스크를 관리하는 관리자 인스턴스
}

export class CubismRendererProfile_WebGL {
  private setGlEnable(index: GLenum, enabled: GLboolean): void {
    if (enabled) this.gl.enable(index); 
    else this.gl.disable(index);
  }

  private setGlEnableVertexAttribArray(
    index: GLuint,
    enabled: GLboolean
  ): void {
    if (enabled) this.gl.enableVertexAttribArray(index); 
    else this.gl.disableVertexAttribArray(index);
  }

  public save(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    //-- push state --
    this._lastArrayBufferBinding = this.gl.getParameter(
      this.gl.ARRAY_BUFFER_BINDING
    );
    this._lastElementArrayBufferBinding = this.gl.getParameter(
      this.gl.ELEMENT_ARRAY_BUFFER_BINDING
    );
    this._lastProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);

    this._lastActiveTexture = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
    this.gl.activeTexture(this.gl.TEXTURE1); // 텍스처 유닛 1을 활성화 (이후 설정 대상으로 함)
    this._lastTexture1Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );

    this.gl.activeTexture(this.gl.TEXTURE0); // 텍스처 유닛 0을 활성화 (이후 설정 대상으로 함)
    this._lastTexture0Binding2D = this.gl.getParameter(
      this.gl.TEXTURE_BINDING_2D
    );

    this._lastVertexAttribArrayEnabled[0] = this.gl.getVertexAttrib(
      0,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[1] = this.gl.getVertexAttrib(
      1,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[2] = this.gl.getVertexAttrib(
      2,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );
    this._lastVertexAttribArrayEnabled[3] = this.gl.getVertexAttrib(
      3,
      this.gl.VERTEX_ATTRIB_ARRAY_ENABLED
    );

    this._lastScissorTest = this.gl.isEnabled(this.gl.SCISSOR_TEST);
    this._lastStencilTest = this.gl.isEnabled(this.gl.STENCIL_TEST);
    this._lastDepthTest = this.gl.isEnabled(this.gl.DEPTH_TEST);
    this._lastCullFace = this.gl.isEnabled(this.gl.CULL_FACE);
    this._lastBlend = this.gl.isEnabled(this.gl.BLEND);

    this._lastFrontFace = this.gl.getParameter(this.gl.FRONT_FACE);

    this._lastColorMask = this.gl.getParameter(this.gl.COLOR_WRITEMASK);

    // backup blending
    this._lastBlending[0] = this.gl.getParameter(this.gl.BLEND_SRC_RGB);
    this._lastBlending[1] = this.gl.getParameter(this.gl.BLEND_DST_RGB);
    this._lastBlending[2] = this.gl.getParameter(this.gl.BLEND_SRC_ALPHA);
    this._lastBlending[3] = this.gl.getParameter(this.gl.BLEND_DST_ALPHA);

    // 모델 그리기 직전의 FBO와 뷰포트 저장
    this._lastFBO = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    this._lastViewport = this.gl.getParameter(this.gl.VIEWPORT);
  }

  public restore(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }
    this.gl.useProgram(this._lastProgram);

    this.setGlEnableVertexAttribArray(0, this._lastVertexAttribArrayEnabled[0]);
    this.setGlEnableVertexAttribArray(1, this._lastVertexAttribArrayEnabled[1]);
    this.setGlEnableVertexAttribArray(2, this._lastVertexAttribArrayEnabled[2]);
    this.setGlEnableVertexAttribArray(3, this._lastVertexAttribArrayEnabled[3]);

    this.setGlEnable(this.gl.SCISSOR_TEST, this._lastScissorTest);
    this.setGlEnable(this.gl.STENCIL_TEST, this._lastStencilTest);
    this.setGlEnable(this.gl.DEPTH_TEST, this._lastDepthTest);
    this.setGlEnable(this.gl.CULL_FACE, this._lastCullFace);
    this.setGlEnable(this.gl.BLEND, this._lastBlend);

    this.gl.frontFace(this._lastFrontFace);

    this.gl.colorMask(
      this._lastColorMask[0],
      this._lastColorMask[1],
      this._lastColorMask[2],
      this._lastColorMask[3]
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this._lastArrayBufferBinding); // 이전에 버퍼가 바인딩되어 있었다면 해제해야 함
    this.gl.bindBuffer(
      this.gl.ELEMENT_ARRAY_BUFFER,
      this._lastElementArrayBufferBinding
    );

    this.gl.activeTexture(this.gl.TEXTURE1); // 텍스처 유닛 1 복원
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture1Binding2D);

    this.gl.activeTexture(this.gl.TEXTURE0); // 텍스처 유닛 0 복원
    this.gl.bindTexture(this.gl.TEXTURE_2D, this._lastTexture0Binding2D);

    this.gl.activeTexture(this._lastActiveTexture);

    this.gl.blendFuncSeparate(
      this._lastBlending[0],
      this._lastBlending[1],
      this._lastBlending[2],
      this._lastBlending[3]
    );
  }

  public setGl(gl: WebGLRenderingContext): void {
    this.gl = gl;
  }

  constructor() {
    this._lastVertexAttribArrayEnabled = new Array<GLboolean>(4);
    this._lastColorMask = new Array<GLboolean>(4);
    this._lastBlending = new Array<GLint>(4);
    this._lastViewport = new Array<GLint>(4);
  }

  private _lastArrayBufferBinding: GLint; ///< 모델 그리기 직전의 정점 버퍼
  private _lastElementArrayBufferBinding: GLint; ///< 모델 그리기 직전의 Element 버퍼
  private _lastProgram: GLint; ///< 모델 그리기 직전의 셰이더 프로그램 버퍼
  private _lastActiveTexture: GLint; ///< 모델 그리기 직전의 활성 텍스처
  private _lastTexture0Binding2D: GLint; ///< 모델 그리기 직전의 텍스처 유닛 0
  private _lastTexture1Binding2D: GLint; ///< 모델 그리기 직전의 텍스처 유닛 1
  private _lastVertexAttribArrayEnabled: GLboolean[]; ///< 모델 그리기 직전의 텍스처 유닛 1
  private _lastScissorTest: GLboolean; ///< 모델 그리기 직전의 GL_VERTEX_ATTRIB_ARRAY_ENABLED 파라미터
  private _lastBlend: GLboolean; ///< 모델 그리기 직전의 GL_SCISSOR_TEST 파라미터
  private _lastStencilTest: GLboolean; ///< 모델 그리기 직전의 GL_STENCIL_TEST 파라미터
  private _lastDepthTest: GLboolean; ///< 모델 그리기 직전의 GL_DEPTH_TEST 파라미터
  private _lastCullFace: GLboolean; ///< 모델 그리기 직전의 GL_CULL_FACE 파라미터
  private _lastFrontFace: GLint; ///< 모델 그리기 직전의 GL_CULL_FACE 파라미터
  private _lastColorMask: GLboolean[]; ///< 모델 그리기 직전의 GL_COLOR_WRITEMASK 파라미터
  private _lastBlending: GLint[]; ///< 모델 그리기 직전의 컬러 블렌딩 파라미터
  private _lastFBO: GLint; ///< 모델 그리기 직전의 프레임 버퍼
  private _lastViewport: GLint[]; ///< 모델 그리기 직전의 뷰포트

  gl: WebGLRenderingContext;
}

/**
 * WebGL용 그리기 명령을 구현한 클래스
 */
export class CubismRenderer_WebGL extends CubismRenderer {
  /**
   * 렌더러 초기화 처리를 실행합니다.
   * 인자로 전달된 모델에서 렌더러 초기화 처리에 필요한 정보를 가져올 수 있습니다.
   *
   * @param model 모델의 인스턴스
   * @param maskBufferCount 버퍼 생성 수
   */
  public initialize(model: CubismModel, maskBufferCount = 1): void {
    if (model.isUsingMasking()) {
      this._clippingManager = new CubismClippingManager_WebGL(); // 클리핑 마스크·버퍼 전처리 방식 초기화
      this._clippingManager.initialize(model, maskBufferCount);
    }

    this._sortedDrawableIndexList.resize(model.getDrawableCount(), 0);

    super.initialize(model); // 부모 클래스의 처리 호출
  }

  /**
   * WebGL 텍스처 바인딩 처리
   * CubismRenderer에 텍스처를 설정하고 CubismRenderer 내에서 해당 이미지를 참조하기 위한 Index 값을 반환합니다.
   * @param modelTextureNo 설정할 모델 텍스처 번호
   * @param glTextureNo WebGL 텍스처 번호
   */
  public bindTexture(modelTextureNo: number, glTexture: WebGLTexture): void {
    this._textures.setValue(modelTextureNo, glTexture);
  }

  /**
   * WebGL에 바인딩된 텍스처 목록을 가져옵니다.
   * @return 텍스처 목록
   */
  public getBindedTextures(): csmMap<number, WebGLTexture> {
    return this._textures;
  }

  /**
   * 클리핑 마스크 버퍼 크기를 설정합니다.
   * 마스크용 FrameBuffer를 파기, 재생성하므로 처리 비용이 높습니다.
   * @param size 클리핑 마스크 버퍼 크기
   */
  public setClippingMaskBufferSize(size: number) {
    // 클리핑 마스크를 사용하지 않는 경우 조기 반환
    if (!this._model.isUsingMasking()) {
      return;
    }

    // 인스턴스 파기 전 렌더 텍스처 수 저장
    const renderTextureCount: number =
      this._clippingManager.getRenderTextureCount();

    // FrameBuffer 크기를 변경하기 위해 인스턴스 파기·재생성
    this._clippingManager.release();
    this._clippingManager = void 0;
    this._clippingManager = null;

    this._clippingManager = new CubismClippingManager_WebGL();

    this._clippingManager.setClippingMaskBufferSize(size);

    this._clippingManager.initialize(
      this.getModel(),
      renderTextureCount // 인스턴스 파기 전에 저장한 렌더 텍스처 수
    );
  }

  /**
   * 클리핑 마스크 버퍼 크기를 가져옵니다.
   * @return 클리핑 마스크 버퍼 크기
   */
  public getClippingMaskBufferSize(): number {
    return this._model.isUsingMasking()
      ? this._clippingManager.getClippingMaskBufferSize()
      : -1;
  }

  /**
   * 렌더 텍스처 수를 가져옵니다.
   * @return 렌더 텍스처 수
   */
  public getRenderTextureCount(): number {
    return this._model.isUsingMasking()
      ? this._clippingManager.getRenderTextureCount()
      : -1;
  }

  /**
   * 생성자
   */
  public constructor() {
    super();
    this._clippingContextBufferForMask = null;
    this._clippingContextBufferForDraw = null;
    this._rendererProfile = new CubismRendererProfile_WebGL();
    this.firstDraw = true;
    this._textures = new csmMap<number, number>();
    this._sortedDrawableIndexList = new csmVector<number>();
    this._bufferData = {
      vertex: (WebGLBuffer = null),
      uv: (WebGLBuffer = null),
      index: (WebGLBuffer = null)
    };

    // 텍스처 대응 맵의 용량을 확보해 둠
    this._textures.prepareCapacity(32, true);
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    if (this._clippingManager) {
      this._clippingManager.release();
      this._clippingManager = void 0;
      this._clippingManager = null;
    }

    if (this.gl == null) {
      return;
    }
    this.gl.deleteBuffer(this._bufferData.vertex);
    this._bufferData.vertex = null;
    this.gl.deleteBuffer(this._bufferData.uv);
    this._bufferData.uv = null;
    this.gl.deleteBuffer(this._bufferData.index);
    this._bufferData.index = null;
    this._bufferData = null;

    this._textures = null;
  }

  /**
   * 모델을 그리는 실제 처리
   */
  public doDrawModel(): void {
    if (this.gl == null) {
      CubismLogError(
        "'gl' is null. WebGLRenderingContext is required.\nPlease call 'CubimRenderer_WebGL.startUp' function."
      );
      return;
    }

    //------------ 클리핑 마스크·버퍼 전처리 방식의 경우 ------------
    if (this._clippingManager != null) {
      this.preDraw();

      if (this.isUsingHighPrecisionMask()) {
        this._clippingManager.setupMatrixForHighPrecision(
          this.getModel(),
          false
        );
      } else {
        this._clippingManager.setupClippingContext(this.getModel(), this);
      }
    }

    // 위 클리핑 처리 내에서도 PreDraw를 한 번 호출하므로 주의!!
    this.preDraw();

    const drawableCount: number = this.getModel().getDrawableCount();
    const renderOrder: Int32Array = this.getModel().getDrawableRenderOrders();

    // 인덱스를 그리기 순서로 정렬
    for (let i = 0; i < drawableCount; ++i) {
      const order: number = renderOrder[i];
      this._sortedDrawableIndexList.set(order, i);
    }

    // 그리기
    for (let i = 0; i < drawableCount; ++i) {
      const drawableIndex: number = this._sortedDrawableIndexList.at(i);

      // Drawable이 표시 상태가 아니면 처리 통과
      if (!this.getModel().getDrawableDynamicFlagIsVisible(drawableIndex)) {
        continue;
      }

      const clipContext =
        this._clippingManager != null
          ? this._clippingManager
              .getClippingContextListForDraw()
              .at(drawableIndex)
          : null;

      if (clipContext != null && this.isUsingHighPrecisionMask()) {
        // 그리기로 되어 있었음
        if (clipContext._isUsing) {
          // 생성된 FrameBuffer와 동일한 크기로 뷰포트 설정
          this.gl.viewport(
            0,
            0,
            this._clippingManager.getClippingMaskBufferSize(),
            this._clippingManager.getClippingMaskBufferSize()
          );

          this.preDraw(); // 버퍼를 지웁니다.

          // ---------- 마스크 그리기 처리 ----------
          // 마스크용 RenderTexture를 active로 설정
          this.gl.bindFramebuffer(
            this.gl.FRAMEBUFFER,
            clipContext
              .getClippingManager()
              .getMaskRenderTexture()
              .at(clipContext._bufferIndex)
          );

          // 마스크를 지웁니다.
          // (임시 사양) 1은 비활성(그려지지 않음) 영역, 0은 활성(그려짐) 영역. (셰이더 Cd*Cs로 0에 가까운 값을 곱하여 마스크를 만듭니다. 1을 곱하면 아무 일도 일어나지 않습니다.)
          this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
          this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }

        {
          const clipDrawCount: number = clipContext._clippingIdCount;

          for (let index = 0; index < clipDrawCount; index++) {
            const clipDrawIndex: number = clipContext._clippingIdList[index];

            // 정점 정보가 업데이트되지 않아 신뢰할 수 없는 경우 그리기를 건너뜁니다.
            if (
              !this._model.getDrawableDynamicFlagVertexPositionsDidChange(
                clipDrawIndex
              )
            ) {
              continue;
            }

            this.setIsCulling(
              this._model.getDrawableCulling(clipDrawIndex) != false
            );

            // 이번 전용 변환을 적용하여 그립니다.
            // 채널도 전환해야 함(A,R,G,B)
            this.setClippingContextBufferForMask(clipContext);

            this.drawMeshWebGL(this._model, clipDrawIndex);
          }
        }

        {
          // --- 후처리 ---
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, s_fbo); // 그리기 대상을 되돌립니다.
          this.setClippingContextBufferForMask(null);

          this.gl.viewport(
            s_viewport[0],
            s_viewport[1],
            s_viewport[2],
            s_viewport[3]
          );

          this.preDraw(); // 버퍼를 지웁니다.
        }
      }

      // 클리핑 마스크 설정
      this.setClippingContextBufferForDraw(clipContext);

      this.setIsCulling(this.getModel().getDrawableCulling(drawableIndex));

      this.drawMeshWebGL(this._model, drawableIndex);
    }
  }

  /**
   * 그리기 개체(아트 메쉬)를 그립니다.
   * @param model 그릴 대상 모델
   * @param index 그릴 대상 메쉬의 인덱스
   */
  public drawMeshWebGL(model: Readonly<CubismModel>, index: number): void {
    // 뒷면 그리기 활성화/비활성화
    if (this.isCulling()) {
      this.gl.enable(this.gl.CULL_FACE);
    } else {
      this.gl.disable(this.gl.CULL_FACE);
    }

    this.gl.frontFace(this.gl.CCW); // Cubism SDK OpenGL은 마스크·아트 메쉬 모두 CCW가 표면

    if (this.isGeneratingMask()) {
      CubismShaderManager_WebGL.getInstance()
        .getShader(this.gl)
        .setupShaderProgramForMask(this, model, index);
    } else {
      CubismShaderManager_WebGL.getInstance()
        .getShader(this.gl)
        .setupShaderProgramForDraw(this, model, index);
    }

    {
      const indexCount: number = model.getDrawableVertexIndexCount(index);
      this.gl.drawElements(
        this.gl.TRIANGLES,
        indexCount,
        this.gl.UNSIGNED_SHORT,
        0
      );
    }

    // 후처리
    this.gl.useProgram(null);
    this.setClippingContextBufferForDraw(null);
    this.setClippingContextBufferForMask(null);
  }

  protected saveProfile(): void {
    this._rendererProfile.save();
  }

  protected restoreProfile(): void {
    this._rendererProfile.restore();
  }

  /**
   * 렌더러가 보유한 정적 리소스를 해제합니다.
   * WebGL의 정적 셰이더 프로그램을 해제합니다.
   */
  public static doStaticRelease(): void {
    CubismShaderManager_WebGL.deleteInstance();
  }

  /**
   * 렌더링 상태를 설정합니다.
   * @param fbo 애플리케이션 측에서 지정하는 프레임 버퍼
   * @param viewport 뷰포트
   */
  public setRenderState(fbo: WebGLFramebuffer, viewport: number[]): void {
    s_fbo = fbo;
    s_viewport = viewport;
  }

  /**
   * 그리기 시작 시 추가 처리
   * 모델을 그리기 전에 클리핑 마스크에 필요한 처리를 구현하고 있습니다.
   */
  public preDraw(): void {
    if (this.firstDraw) {
      this.firstDraw = false;
    }

    this.gl.disable(this.gl.SCISSOR_TEST);
    this.gl.disable(this.gl.STENCIL_TEST);
    this.gl.disable(this.gl.DEPTH_TEST);

    // 컬링 (1.0beta3)
    this.gl.frontFace(this.gl.CW);

    this.gl.enable(this.gl.BLEND);
    this.gl.colorMask(true, true, true, true);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null); // 이전에 버퍼가 바인딩되어 있었다면 해제해야 함
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

    // 비등방성 필터링 적용
    if (this.getAnisotropy() > 0.0 && this._extension) {
      for (let i = 0; i < this._textures.getSize(); ++i) {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._textures.getValue(i));
        this.gl.texParameterf(
          this.gl.TEXTURE_2D,
          this._extension.TEXTURE_MAX_ANISOTROPY_EXT,
          this.getAnisotropy()
        );
      }
    }
  }

  /**
   * 마스크 텍스처에 그릴 클리핑 컨텍스트를 설정합니다.
   */
  public setClippingContextBufferForMask(clip: CubismClippingContext_WebGL) {
    this._clippingContextBufferForMask = clip;
  }

  /**
   * 마스크 텍스처에 그릴 클리핑 컨텍스트를 가져옵니다.
   * @return 마스크 텍스처에 그릴 클리핑 컨텍스트
   */
  public getClippingContextBufferForMask(): CubismClippingContext_WebGL {
    return this._clippingContextBufferForMask;
  }

  /**
   * 화면에 그릴 클리핑 컨텍스트를 설정합니다.
   */
  public setClippingContextBufferForDraw(
    clip: CubismClippingContext_WebGL
  ): void {
    this._clippingContextBufferForDraw = clip;
  }

  /**
   * 화면에 그릴 클리핑 컨텍스트를 가져옵니다.
   * @return 화면에 그릴 클리핑 컨텍스트
   */
  public getClippingContextBufferForDraw(): CubismClippingContext_WebGL {
    return this._clippingContextBufferForDraw;
  }

  /**
   * 마스크 생성 시인지 판정합니다.
   * @returns 판정 값
   */
  public isGeneratingMask() {
    return this.getClippingContextBufferForMask() != null;
  }

  /**
   * gl 설정
   */
  public startUp(gl: WebGLRenderingContext): void {
    this.gl = gl;

    if (this._clippingManager) {
      this._clippingManager.setGL(gl);
    }

    CubismShaderManager_WebGL.getInstance().setGlContext(gl);
    this._rendererProfile.setGl(gl);

    // 비등방성 필터링 사용 가능 여부 확인
    this._extension =
      this.gl.getExtension('EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
  }

  _textures: csmMap<number, WebGLTexture>; // 모델이 참조하는 텍스처와 렌더러에서 바인딩된 텍스처와의 맵
  _sortedDrawableIndexList: csmVector<number>; // 그리기 개체의 인덱스를 그리기 순서로 정렬한 목록
  _clippingManager: CubismClippingManager_WebGL; // 클리핑 마스크 관리 개체
  _clippingContextBufferForMask: CubismClippingContext_WebGL; // 마스크 텍스처에 그리기 위한 클리핑 컨텍스트
  _clippingContextBufferForDraw: CubismClippingContext_WebGL; // 화면에 그리기 위한 클리핑 컨텍스트
  _rendererProfile: CubismRendererProfile_WebGL;
  firstDraw: boolean;
  _bufferData: {
    vertex: WebGLBuffer;
    uv: WebGLBuffer;
    index: WebGLBuffer;
  }; // 정점 버퍼 데이터
  _extension: any; // 확장 기능
  gl: WebGLRenderingContext; // webgl 컨텍스트
}

/**
 * 렌더러가 보유한 정적 리소스를 해제합니다.
 */
CubismRenderer.staticRelease = (): void => {
  CubismRenderer_WebGL.doStaticRelease();
};

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismrenderer_webgl';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismClippingContext = $.CubismClippingContext_WebGL;
  export type CubismClippingContext = $.CubismClippingContext_WebGL;
  export const CubismClippingManager_WebGL = $.CubismClippingManager_WebGL;
  export type CubismClippingManager_WebGL = $.CubismClippingManager_WebGL;
  export const CubismRenderTextureResource = $.CubismRenderTextureResource;
  export type CubismRenderTextureResource = $.CubismRenderTextureResource;
  export const CubismRenderer_WebGL = $.CubismRenderer_WebGL;
  export type CubismRenderer_WebGL = $.CubismRenderer_WebGL;
}