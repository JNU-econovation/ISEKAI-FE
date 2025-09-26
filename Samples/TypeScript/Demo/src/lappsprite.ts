/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 스프라이트를 구현하는 클래스
 *
 * 텍스처 ID 및 직장을 관리합니다
 */
export class LAppSprite {
  /**
   * 생성자
   * @param x x am
   * @param y y 좌표
   * @param 너비
   * @param 높이
   * @param 텍스처 텍스처
   */
  public constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    textureId: WebGLTexture
  ) {
    this._rect = new Rect();
    this._rect.left = x - width * 0.5;
    this._rect.right = x + width * 0.5;
    this._rect.up = y + height * 0.5;
    this._rect.down = y - height * 0.5;
    this._texture = textureId;
    this._vertexBuffer = null;
    this._uvBuffer = null;
    this._indexBuffer = null;

    this._positionLocation = null;
    this._uvLocation = null;
    this._textureLocation = null;

    this._positionArray = null;
    this._uvArray = null;
    this._indexArray = null;

    this._firstDraw = true;
  }

  /**
   * 풀어 주다.
   */
  public release(): void {
    this._rect = null;

    const gl = this._subdelegate.getGlManager().getGl();

    gl.deleteTexture(this._texture);
    this._texture = null;

    gl.deleteBuffer(this._uvBuffer);
    this._uvBuffer = null;

    gl.deleteBuffer(this._vertexBuffer);
    this._vertexBuffer = null;

    gl.deleteBuffer(this._indexBuffer);
    this._indexBuffer = null;
  }

  /**
   * 질감을 반환합니다
   */
  public getTexture(): WebGLTexture {
    return this._texture;
  }

  /**
   * 그리다.
   * @param 프로그램 셰이더 프로그램
   * @Param Canvas 캠퍼스 정보를 그리십시오
   */
  public render(programId: WebGLProgram): void {
    if (this._texture == null) {
      //로드가 완료되지 않았습니다
      return;
    }

    const gl = this._subdelegate.getGlManager().getGl();

    // 처음으로 그리는 경우
    if (this._firstDraw) {
      // 속성 변수 수를 얻습니다
      this._positionLocation = gl.getAttribLocation(programId, 'position');
      gl.enableVertexAttribArray(this._positionLocation);

      this._uvLocation = gl.getAttribLocation(programId, 'uv');
      gl.enableVertexAttribArray(this._uvLocation);

      // 균일 한 변수를 얻습니다
      this._textureLocation = gl.getUniformLocation(programId, 'texture');

      // 균일 한 속성을 등록합니다
      gl.uniform1i(this._textureLocation, 0);

      // UV 버퍼, 조정 초기화
      {
        this._uvArray = new Float32Array([
          1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0
        ]);

        // UV 버퍼를 만듭니다
        this._uvBuffer = gl.createBuffer();
      }

      // vertex 버퍼, 조정 초기화
      {
        const maxWidth = this._subdelegate.getCanvas().width;
        const maxHeight = this._subdelegate.getCanvas().height;

        // 정점 데이터
        this._positionArray = new Float32Array([
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.up - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.left - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5),
          (this._rect.right - maxWidth * 0.5) / (maxWidth * 0.5),
          (this._rect.down - maxHeight * 0.5) / (maxHeight * 0.5)
        ]);

        // 정점 버퍼를 만듭니다
        this._vertexBuffer = gl.createBuffer();
      }

      // 정점 인덱스 버퍼, 초기화
      {
        // 색인 데이터
        this._indexArray = new Uint16Array([0, 1, 2, 3, 2, 0]);

        // 인덱스 버퍼를 만듭니다
        this._indexBuffer = gl.createBuffer();
      }

      this._firstDraw = false;
    }

    // UV 좌표 등록
    gl.bindBuffer(gl.ARRAY_BUFFER, this._uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._uvArray, gl.STATIC_DRAW);

    // 속성 속성을 등록합니다
    gl.vertexAttribPointer(this._uvLocation, 2, gl.FLOAT, false, 0, 0);

    // 정점 좌표를 등록합니다
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._positionArray, gl.STATIC_DRAW);

    // 속성 속성을 등록합니다
    gl.vertexAttribPointer(this._positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 정점 인덱스를 만듭니다
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indexArray, gl.DYNAMIC_DRAW);

    // 모델 그리기
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.drawElements(
      gl.TRIANGLES,
      this._indexArray.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  /**
   *손 결정
   * @param pointx x 座標
   * @param pointy y 좌표
   */
  public isHit(pointX: number, pointY: number): boolean {
    // 화면 크기를 얻습니다.
    const { height } = this._subdelegate.getCanvas();

    // y 좌표를 변환해야합니다
    const y = height - pointY;

    return (
      pointX >= this._rect.left &&
      pointX <= this._rect.right &&
      y <= this._rect.up &&
      y >= this._rect.down
    );
  }

  /**
   * 세터
   * @param subdelegate
   */
  public setSubdelegate(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
  }

  _texture: WebGLTexture; // テクスチャ
  _vertexBuffer: WebGLBuffer; // 頂点バッファ
  _uvBuffer: WebGLBuffer; // uv頂点バッファ
  _indexBuffer: WebGLBuffer; // 頂点インデックスバッファ
  _rect: Rect; // 矩形

  _positionLocation: number;
  _uvLocation: number;
  _textureLocation: WebGLUniformLocation;

  _positionArray: Float32Array;
  _uvArray: Float32Array;
  _indexArray: Uint16Array;

  _firstDraw: boolean;

  private _subdelegate: LAppSubdelegate;
}

export class Rect {
  public left: number; // 左辺
  public right: number; // 右辺
  public up: number; // 上辺
  public down: number; // 下辺
}
