import isPublic from 'saffron-common/src/actors/decorators/public'; 
import loggable from 'saffron-common/src/decorators/loggable';
import IApplication from 'saffron-common/src/application/interface';
import SelectionCollection from 'selection/collection';
import BaseApplicationService from 'saffron-common/src/services/base-application-service';
import { ApplicationServiceFragment } from 'saffron-common/src/fragments/index';

@loggable
export default class SelectorService extends BaseApplicationService<IApplication> {
  load() {
    (this.app as any).selection = [];
  }

  @isPublic
  selectAtSourceOffset({ data }) {

    // TODO - require file in payload
    var entity = (this.app as any).currentFile.entity;
    var allEntities = entity.flatten();

  
    const selection = [];
    for (var entity of allEntities) {
      if (entity.preview) {
        var position = entity.expression.position;   
        for (var cursor of data) {
 
          if (
            (cursor.start >= position.start && cursor.start <= position.end) ||
            (cursor.end   >= position.start && cursor.end <= position.end) ||
            (cursor.start <= position.start && cursor.end >= position.end)
          ) {
            selection.push(entity);
          }

        }
      }
    }
    this.select({
      items: selection,
      toggle: false,
      keepPreviousSelection: false
    });
  }

  /**
   */

  select({ items, toggle, keepPreviousSelection }) {
    const app = this.app;

    if (!items.length) {
      return (app as any).setProperties({
        selection: []
      });
    }

    const prevSelection = (app as any).selection;

    const type = items[0].type;

    const newSelectionFragment = this.app.fragments.query<any>(`selection-collections/${type}`);
    const newSelection = newSelectionFragment ? newSelectionFragment.create() : new SelectionCollection();

    if (keepPreviousSelection && newSelection.constructor === prevSelection.constructor) {
      newSelection.push(...prevSelection);
    } else {
      newSelection.push(...prevSelection.filter((item) => !!~items.indexOf(item)));
    }

    for (const item of items) {
      var i = newSelection.indexOf(item);
      if (~i) {
        if (toggle) {
          newSelection.splice(i, 1);
        }
      } else {
        newSelection.push(item);
      }
    }

    (app as any).setProperties({
      selection: newSelection
    });
  }
}

export const fragment = new ApplicationServiceFragment('application/services/selector', SelectorService);