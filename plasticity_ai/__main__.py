from importlib.util import find_spec
import json
import os
from pathlib import Path
from platform import system
import aamp
import webview
from . import DEBUG
from . import ai, util

class Api:
    def __init__(self):
        self._encoder = util.AiProgJsonEncoder()
        self._decoder = util.AiProgJsonDecoder()

    @util.json_serialize
    def init(self):
        return { 'defs': util.get_ai_defs(), 'trans': util.get_trans_map() }

    @util.json_serialize
    def open_file(self):
        result = self.window.create_file_dialog(webview.OPEN_DIALOG, file_types=(
            'AI Programs (*.baiprog)', 'All Files (*.*)'
        ))
        if result:
            open_path = Path(result[0])
            if open_path.exists():
                pio = aamp.Reader(open_path.read_bytes()).parse()
                res = {
                    'path': open_path.as_posix(),
                    'pio': self._encoder.default(pio)
                }
                return res
        else:
            return {
                'path': ''
            }

    def save_file(self, params):
        if 'path' in params and params['path']:
            open_path = Path(params['path'])
        else:
            result = self.window.create_file_dialog(webview.SAVE_DIALOG, file_types=(
                'AI Programs (*.baiprog)', 'All Files (*.*)'
            ))
            if result:
                open_path = Path(result)
            else:
                return { 'success': False }
        try:
            pio = self._decoder.object_hook(params['pio'])
            open_path.write_bytes(aamp.Writer(pio).get_bytes())
            return { 'success': True }
        except Exception as e:
            return { 'success': False, 'error': str(e) }

    @util.json_serialize
    def create_prog_item(self, params):
        return ai.ProgramAI(params['def'], params['type'])

    def get_ai_tree(self, params):
        tree = ai.AiProgram(self._decoder.object_hook(params['pio'])).get_tree()
        return tree

    @util.json_serialize
    def add_ai_item(self, params):
        ai_item = self._decoder.object_hook(params['ai'])
        new_prog = ai.AiProgram(self._decoder.object_hook(params['prog']['pio']))
        if params['type'] == 'ai':
            new_prog.add_ai(ai_item)
        elif params['type'] == 'action':
            new_prog.add_action(ai_item)
        elif params['type'] == 'behavior':
            new_prog.add_behavior(ai_item)
        elif params['type'] == 'query':
            new_prog.add_query(ai_item)
        return new_prog.generate_pio()

    @util.json_serialize
    def remove_ai_item(self, params):
        new_prog = ai.AiProgram(self._decoder.object_hook(params['prog']['pio']))
        new_prog.remove_item(new_prog.index_from_label(params['idx']))
        return new_prog.generate_pio()


def main():
    api = Api()
    api.window = webview.create_window('Plasticity', url=os.path.join(util.EXEC_DIR, 'assets', 'index.html'), js_api=api, text_select=DEBUG, width=1024)
    use_cef = find_spec('cefpython3') is not None
    gui: str = ''
    if system() == 'Windows' and use_cef:
        gui = 'cef'
    elif system() == 'Linux':
        gui = 'qt'
    webview.start(args=api.window, gui=gui, debug=DEBUG)

if __name__ == "__main__":
    main()
