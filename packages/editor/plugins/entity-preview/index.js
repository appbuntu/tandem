import {
  ApplicationPlugin,
  PreviewComponentPlugin,
  ComponentPlugin,
  Plugin,
  KeyCommandPlugin
} from 'editor/plugin/types';

import { CallbackNotifier } from 'common/notifiers';

import React from 'react';
import Preview from './facades/preview';
import TextTool from './tools/text-tool';
import PointerTool from './tools/pointer-tool';
import PreviewComponent from './components/preview';

export default ApplicationPlugin.create({
  id: 'componentPreview',
  factory: {
    create({ app }) {

      var preview = app.preview = Preview.create({
        canvasWidth  : 1024,
        canvasHeight : 768,
        zoom         : 0.90,
        notifier     : app.notifier
      });

      app.plugins.push(PreviewComponentPlugin.create({
        id: 'basicPreview',
        componentClass: PreviewComponent
      }));

      var textTool    = TextTool.create({ app });
      var pointerTool = PointerTool.create({ app });

      app.plugins.push(
        Plugin.create({
          icon    : 'cursor',
          id      : 'pointerTool',
          type    : 'previewTool',
          tool    : pointerTool
        }),
        Plugin.create({
          icon    : 'text',
          id      : 'textTool',
          type    : 'previewTool',
          tool    : textTool
        }),
        KeyCommandPlugin.create({
          id         : 'textToolKeyCommand',
          keyCommand : 't',
          notifier   : CallbackNotifier.create(
            preview.setTool.bind(preview, textTool)
          )
        }),
        KeyCommandPlugin.create({
          id         : 'pointerToolKeyCommand',
          keyCommand : 'p',
          notifier   : CallbackNotifier.create(
            preview.setTool.bind(preview, pointerTool)
          )
        }),
        KeyCommandPlugin.create({
          id         : 'zoomInKeyCommand',
          keyCommand : 'ctrl+]',
          notifier   : CallbackNotifier.create(
            preview.zoomIn.bind(preview)
          )
        }),
        KeyCommandPlugin.create({
          id         : 'zoomOutKeyCommand',
          keyCommand : 'ctrl+[',
          notifier   : CallbackNotifier.create(
            preview.zoomOut.bind(preview)
          )
        })
      );

      preview.setTool(pointerTool);

    }
  }
})