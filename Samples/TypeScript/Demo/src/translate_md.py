# translate_md.py (마크다운 파일 전용 번역 스크립트)

import os
from deep_translator import GoogleTranslator
import time

# ------------------- 설정 -------------------
# 번역 대상 확장자를 '.md'로 고정합니다.
TARGET_EXTENSIONS = ['.md']
EXCLUDE_DIRS = ['node_modules', 'dist', 'venv', '.git']
# 이 스크립트 자신은 번역 대상에서 제외합니다.
EXCLUDE_FILES = ['translate_comments.py', 'translate_md.py']
# -------------------------------------------

# 번역기 객체 생성 (소스: 자동감지, 타겟: 한국어)
translator = GoogleTranslator(source='auto', target='ko')

def translate_line(line):
    """한 줄의 텍스트를 통째로 번역합니다."""
    # 비어있는 줄은 форматирование 유지를 위해 그대로 둡니다.
    if not line.strip():
        return line

    try:
        # API 과호출 방지를 위한 딜레이
        time.sleep(0.1)
        translated_text = translator.translate(line)
        
        if translated_text:
            # 원본의 줄바꿈을 유지하기 위해 '\n'을 붙이지 않습니다.
            return translated_text
        else:
            return line # 번역 실패 시 원본 유지

    except Exception as e:
        print(f"⚠️  번역 오류 발생 (원본 유지): {line.strip()} | 오류: {e}")
        return line

def process_file(file_path):
    """파일을 한 줄씩 읽어 번역하고 다시 저장합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # readlines()는 각 줄 끝에 \n을 포함합니다.
            lines = f.readlines()

        print(f"⏳  MD 파일 번역 중...: {file_path}")
        
        # 각 줄을 번역하되, 원본의 줄바꿈(\n)을 유지하기 위해 rstrip()으로 제거 후 다시 추가합니다.
        translated_lines = []
        for line in lines:
            original_line_content = line.rstrip('\n')
            # 비어있는 줄은 그냥 추가
            if not original_line_content:
                translated_lines.append('\n')
                continue
            
            translated_content = translate_line(original_line_content)
            translated_lines.append(translated_content + '\n')

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(translated_lines)
            
        print(f"✅  번역 완료: {file_path}")

    except Exception as e:
        print(f"❌  파일 처리 실패: {file_path} | 오류: {e}")


if __name__ == "__main__":
    project_root = os.getcwd()
    print("🚀  마크다운(.md) 파일 번역을 시작합니다.")
    print(f"프로젝트 경로: {project_root}\n")

    for root, dirs, files in os.walk(project_root, topdown=True):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if file in EXCLUDE_FILES or not any(file.endswith(ext) for ext in TARGET_EXTENSIONS):
                continue
            
            file_path = os.path.join(root, file)
            process_file(file_path)
            
    print("\n🎉  모든 MD 파일 번역이 완료되었습니다!")