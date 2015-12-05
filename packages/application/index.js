import BaseObject from 'object';
import { Registry } from 'registry';
import { NotifierCollection } from 'notifiers';
import { InitializeMessage, LoadMessage } from 'notifier-messages';
import mixinChangeNotifier from 'mixin-change-notifier';

class BaseApplication extends BaseObject {

  static plugins = [];

  constructor(properties) {
    super(properties);

    // application extensions
    this.plugins = [];

    // class registry such as components classes, tools, models
    this.registry = Registry.create();

    // central communication object
    this.notifier = NotifierCollection.create();

    // load in initial plugins immediately
    this.usePlugin(...this.constructor.plugins);
  }

  /**
   * registers a new plugin
   */

  usePlugin(...plugins) {
    for (var plugin of plugins) {
      this.plugins.push(plugin.create({
        application: this
      }));
    }
  }

  /**
   * initializes the application
   */

  async initialize(config) {
    
    this.config = config;

    // first load the app
    await this.notifier.notify(LoadMessage.create());

    // then initialize
    await this.notifier.notify(InitializeMessage.create());
  }
}

BaseApplication = mixinChangeNotifier(BaseApplication);

export default BaseApplication;