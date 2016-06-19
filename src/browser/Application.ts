

import IFragment from 'common/fragments/IFragment';
import BaseApplication from 'common/application/Base';

import editorFragment from './fragments/editor/index';
 
class BrowserApplication extends BaseApplication {
  constructor(properties = {}) {
    super(properties, [
      editorFragment
    ]);
  }
}

export default BrowserApplication;