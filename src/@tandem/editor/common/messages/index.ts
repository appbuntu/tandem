import { ISyntheticSourceInfo } from "@tandem/sandbox";
import { RemoteBrowserDocumentMessage, OpenRemoteBrowserRequest } from "@tandem/synthetic-browser";
import {
  CoreEvent,
  Mutation,
  serialize,
  deserialize,
  BoundingRect,
  serializable,
  ChildMutation,
  PostDSMessage,
  RemoveMutation,
  DSUpsertRequest,
  ISourceLocation,
  MoveChildMutation,
  ApplicationReadyMessage,
} from "@tandem/common";

import {
  FileCacheAction,
  ReadFileRequest,
  WatchFileRequest,
  DependencyEvent,
  ISyntheticObject,
  WriteFileRequest,
  ApplyFileEditRequest,
  UpdateFileCacheRequest,
  // ReadDirectoryRequest,
  SandboxModuleAction,
} from "@tandem/sandbox";

import { 
  IMessage,
  readOneChunk,
  SocketIOBus,
  DSFindRequest,
  WritableStream,
  DSTailRequest,
  DSInsertRequest,
  DSRemoveRequest,
  DSUpdateRequest,
  DSFindAllRequest,
  TransformStream,
  setMessageTarget,
  addMessageVisitor,
  IStreamableDispatcher,
} from "@tandem/mesh";

import { Project, IProjectData } from "../stores";

export namespace EditorFamilyType {

  /**
   * Peer (client) application such as an extension
   */

  export const TEXT_EDITOR    = "textEditor";

  /**
   * editor app
   */

  export const BROWSER = "browser";

  /**
   * Heavy lifter - may be a web worker, node worker, or live in a remote location
   */

  export const WORKER  = "worker";

  /**
   * Main app all others talk to
   */

  export const MASTER  = "master";
}


addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(WatchFileRequest));
addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(ReadFileRequest));
addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(WriteFileRequest));
addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(UpdateFileCacheRequest));
setMessageTarget(EditorFamilyType.WORKER)(ApplyFileEditRequest);

addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(DSFindRequest))
addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(DSUpdateRequest))
setMessageTarget(EditorFamilyType.WORKER)(DSUpsertRequest);
setMessageTarget(EditorFamilyType.WORKER)(DSInsertRequest);
setMessageTarget(EditorFamilyType.WORKER)(DSRemoveRequest);
addMessageVisitor(EditorFamilyType.MASTER)(setMessageTarget(EditorFamilyType.WORKER)(DSUpdateRequest));
setMessageTarget(EditorFamilyType.WORKER)(DSFindAllRequest);

addMessageVisitor(EditorFamilyType.MASTER, EditorFamilyType.WORKER, EditorFamilyType.BROWSER, EditorFamilyType.TEXT_EDITOR)(PostDSMessage);
addMessageVisitor(EditorFamilyType.MASTER, EditorFamilyType.BROWSER, EditorFamilyType.TEXT_EDITOR)(setMessageTarget(EditorFamilyType.WORKER)(DSTailRequest));
addMessageVisitor(EditorFamilyType.MASTER, EditorFamilyType.WORKER, EditorFamilyType.WORKER)(ApplicationReadyMessage);
@addMessageVisitor(EditorFamilyType.BROWSER)
@addMessageVisitor(EditorFamilyType.WORKER)
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("OpenFileRequest", {
  serialize({ uri, selection }: OpenFileRequest) {
    return { uri, selection };
  },
  deserialize({ uri, selection }, kernel) {
    return new OpenFileRequest(uri, selection);
  }
})
export class OpenFileRequest extends CoreEvent {
  static readonly OPEN_FILE = "openSourceFile";
  constructor(readonly uri: string, readonly selection?: ISourceLocation) {
    super(OpenFileRequest.OPEN_FILE);
  }
  static dispatch(uri: string, selection: ISyntheticSourceInfo, bus: IStreamableDispatcher<any>) {
    // TODO - RESOLVE HERE
    return bus.dispatch(new OpenFileRequest(uri, selection));
  }
}

@addMessageVisitor(EditorFamilyType.WORKER)
@setMessageTarget(EditorFamilyType.MASTER)
export class SaveAllRequest extends CoreEvent {
  static readonly SAVE_ALL = "saveAll";
  constructor() {
    super(SaveAllRequest.SAVE_ALL);
  }
}

@addMessageVisitor(EditorFamilyType.MASTER)
@setMessageTarget(EditorFamilyType.TEXT_EDITOR)
@serializable("SetCurrentFileRequest", {
  serialize({ uri, selection }: SetCurrentFileRequest) {
    return { uri, selection };
  },
  deserialize({ uri, selection }, kernel) {
    return new SetCurrentFileRequest(uri, selection);
  }
})
export class SetCurrentFileRequest extends CoreEvent {
  static readonly SET_CURRENT_FILE = "setCurrentFile";
  constructor(readonly uri: string, readonly selection?: ISourceLocation) {
    super(SetCurrentFileRequest.SET_CURRENT_FILE);
  }
  static dispatch(uri: string, selection: ISyntheticSourceInfo, bus: IStreamableDispatcher<any>) {
    return bus.dispatch(new SetCurrentFileRequest(uri, selection));
  }
}

// opens the given workspace in this session
@setMessageTarget(EditorFamilyType.BROWSER)
@serializable("OpenWorkspaceRequest")
export class OpenWorkspaceRequest extends CoreEvent {
  static readonly OPEN_WORKSPACE = "openWorkspace";
  constructor(readonly project: Project) {
    super(OpenWorkspaceRequest.OPEN_WORKSPACE);
  }

  static async dispatch(project: Project, bus: IStreamableDispatcher<any>): Promise<boolean> {
    return (await readOneChunk(bus.dispatch(new OpenWorkspaceRequest(project)))).value;
  }
}


// opens the given workspace in this session
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("CreateNewProjectRequest")
export class CreateNewProjectRequest extends CoreEvent {
  static readonly CREATE_NEW_PROJECT = "createNewProject";
  constructor(readonly owner: string, readonly uri: string) {
    super(CreateNewProjectRequest.CREATE_NEW_PROJECT);
  }

  static async dispatch(owner: string, uri: string, bus: IStreamableDispatcher<any>): Promise<Project> {
    return (await readOneChunk(bus.dispatch(new CreateNewProjectRequest(owner, uri)))).value;
  }
}


export class IOClientConnectedMessage extends CoreEvent {
  static readonly IO_CLIENT_CONNECTED = "ioClientConnected";
  constructor(readonly bus: SocketIOBus<any>) {
    super(IOClientConnectedMessage.IO_CLIENT_CONNECTED);
  }
}
@addMessageVisitor(EditorFamilyType.MASTER, EditorFamilyType.BROWSER, EditorFamilyType.WORKER)
export class IOClientDisconnectedMessage extends CoreEvent {
  static readonly IO_CLIENT_DISCONNECTED = "ioClientDisonnected";
  constructor() {
    super(IOClientDisconnectedMessage.IO_CLIENT_DISCONNECTED);
  }
}


@setMessageTarget(EditorFamilyType.MASTER)
export class PingRequest implements IMessage {
  static readonly PING: string = "ping";
  readonly type = PingRequest.PING;
}

// opens the given workspace in this session
@addMessageVisitor(EditorFamilyType.MASTER)
@setMessageTarget(EditorFamilyType.WORKER)
@serializable("OpenProjectEnvironmentChannelRequest")
export class OpenProjectEnvironmentChannelRequest extends CoreEvent {
  static readonly OPEN_PROJECT_ENVIRONMENT_CHANNEL = "openProjectEnvironmentChannel";
  constructor(readonly projectId: string) {
    super(OpenProjectEnvironmentChannelRequest.OPEN_PROJECT_ENVIRONMENT_CHANNEL);
  }
}

// opens the given workspace in this session
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("GetProjectRequest")
export class GetProjectRequest extends CoreEvent {
  static readonly GET_PROJECT = "getProject";
  constructor(readonly projectId: string) {
    super(GetProjectRequest.GET_PROJECT);
  }

  static async dispatch(projectId: string, bus: IStreamableDispatcher<any>): Promise<Project> {
    return (await readOneChunk(bus.dispatch(new GetProjectRequest(projectId)))).value;
  }
}


// opens the given workspace in this session
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("WatchProjectRequest")
export class WatchProjectRequest extends CoreEvent {
  static readonly WATCH_PROJECT = "watchProject";
  constructor(readonly projectId: string) {
    super(WatchProjectRequest.WATCH_PROJECT);
  }

  static dispatch(projectId: string, bus: IStreamableDispatcher<any>, onChange?: () => any): { dispose(): any } {
    const { readable, writable } = (bus.dispatch(new WatchProjectRequest(projectId)));

    readable.pipeTo(new WritableStream({
      write: () => onChange()
    }));

    return {
      dispose() {
        writable.getWriter().close();
      }
    }
  }
}

// opens the given workspace in this session
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("UpdateProjectRequest")
export class UpdateProjectRequest extends CoreEvent {
  static readonly UPDATE_PROJECT = "updateProject";
  constructor(readonly projectId: string, readonly data: IProjectData) {
    super(UpdateProjectRequest.UPDATE_PROJECT);
  }
}

export interface INewWorkspaceOptions {
  commonjs?: boolean;
}

@addMessageVisitor(EditorFamilyType.TEXT_EDITOR)
@addMessageVisitor(EditorFamilyType.WORKER)
@setMessageTarget(EditorFamilyType.MASTER)
@serializable("OpenNewWorkspaceRequest")
export class OpenNewWorkspaceRequest implements IMessage {
  static readonly OPEN_NEW_WORKSPACE: string = "openNewWorkspace";
  readonly type = OpenNewWorkspaceRequest.OPEN_NEW_WORKSPACE;
  constructor(readonly projectOrFilePath: Project|string, options: INewWorkspaceOptions = {}) { }
}

@setMessageTarget(EditorFamilyType.MASTER)
export class ResolveWorkspaceURIRequest implements IMessage {
  static readonly RESOLVE_WORKSPACE_URI: string = "resolveWorkspaceUri";
  readonly type = ResolveWorkspaceURIRequest.RESOLVE_WORKSPACE_URI;
  constructor(readonly uri: string) {

  }

  static async dispatch(uri: string, bus: IStreamableDispatcher<any>): Promise<string> {
    return (await readOneChunk(bus.dispatch(new ResolveWorkspaceURIRequest(uri)))).value;
  }
}

@setMessageTarget(EditorFamilyType.MASTER)
export class CreateTemporaryWorkspaceRequest implements IMessage {
  static readonly CREATE_TEMPORARY_WORKSPACE: string = "createTemporaryWorkspace";
  readonly type = CreateTemporaryWorkspaceRequest.CREATE_TEMPORARY_WORKSPACE;
  constructor(readonly uri: string) { }

  static async dispatch(uri: string, bus: IStreamableDispatcher<any>):Promise<string> {
    return (await readOneChunk<string>(bus.dispatch(new CreateTemporaryWorkspaceRequest(uri)))).value;
  }
}

@addMessageVisitor(EditorFamilyType.BROWSER)
@addMessageVisitor(EditorFamilyType.MASTER)
@setMessageTarget(EditorFamilyType.WORKER)
@serializable("ImportFileRequest", {
  serialize({ uri, bounds, targetObject }: ImportFileRequest) {
    return [ uri, bounds, serialize(targetObject && targetObject.clone(false)) ];
  },
  deserialize([ uri, bounds, targetObject ], kernel) {
    return new ImportFileRequest(uri, bounds, deserialize(targetObject, kernel));
  }
})
export class ImportFileRequest extends CoreEvent {
  static readonly IMPORT_FILE = "importFile";
  readonly uri: string;
  constructor(uri: string, readonly bounds?: BoundingRect, readonly targetObject?: ISyntheticObject) {
    super(ImportFileRequest.IMPORT_FILE);
    this.uri = decodeURIComponent(uri);
  }
}

@setMessageTarget(EditorFamilyType.BROWSER)
@serializable("SelectSourceRequest", {
  serialize({ uri, ranges }: SelectSourceRequest) {
    return {
      uri: uri,
      ranges: ranges
    }
  },
  deserialize({ uri, ranges }): SelectSourceRequest {
    return new SelectSourceRequest(uri, ranges);
  }
})
export class SelectSourceRequest extends CoreEvent {
  static readonly SELECT_SOURCE = "selectSource";
  constructor(readonly uri: string, readonly ranges: ISourceLocation[]) {
    super(SelectSourceRequest.SELECT_SOURCE);
  }
}

export class GetTunnelUrlRequest extends CoreEvent {
  static readonly GET_TUNNEL_URL = "getTunnelUrl";
  constructor() {
    super(GetTunnelUrlRequest.GET_TUNNEL_URL);
  }
  static async dispatch(bus: IStreamableDispatcher<any>): Promise<string> {
    return (await readOneChunk(bus.dispatch(new GetTunnelUrlRequest()))).value;
  }
}

