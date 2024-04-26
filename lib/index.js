'use babel';

import { CompositeDisposable } from "event-kit";
import { ListSorter } from './list-sorter';

let editor = null;

module.exports = {

  activate() {
    this.subscriptions = new CompositeDisposable();
    const mde = inkdrop.getActiveEditor()
    if (mde !== undefined) {
      editor = new ListSorter(mde.cm);
    } else {
      this.subscriptions.add(
          inkdrop.onEditorLoad((e) => {
            editor = new ListSorter(e.cm);
          })
      );
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    editor.dispose();
  },
};
