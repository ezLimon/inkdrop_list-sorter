'use babel';

import { Disposable, CompositeDisposable } from "event-kit";
import { Pos } from "codemirror";

const NAMESPACE = "list-sorter";
const REGEX_STRING_IS_LIST = '^\\s*[\-\*\+].*$';
const SORT_ASC = 1;
const SORT_DESC = -1;


export class ListSorter extends Disposable {
  constructor(cm) {
    super(() => this.destroy());
    this.cm = cm;
    this.subscriptions = new CompositeDisposable();
    this.registerCommand("ascending", () => this.sortList(SORT_ASC));
    this.registerCommand("descending", () => this.sortList(SORT_DESC));
  }


  /**
   * true of false based on if the string is a list element
   * following markdown synthax.
   * Accepted pattern are defined in REGEX_STRING_IS_LIST.
   * @param {number} index - A non negative row number
   * @return {boolean}
   */
  isListElement(str) {
    const regex = new RegExp(REGEX_STRING_IS_LIST);
    return regex.test(str);
  }


  /**
   * Returns a dict containing info for the line index with the following keys:
   *    "str": Content of the line
   *    "cursor": Boolean, if the cursor is on this line
   *    "srcIdx": index number to keep a trace
   * @param {number} index - Line number in the doc
   * @returns {dict}
   */
  getLineInfo(index) {
    return {
      "str": this.cm.doc.getLine(index),
      "cursor": this.cm.doc.getCursor(true).line == index,
      "srcIdx": index
    }
  }


  /**
   * Returns the number of white space at the beginning of the line.
   * Used to determine the indetation to keep sub lists in the correct place.
   * @param {string} str
   * @returns {number}
   */
  getElementLevel(str) {
    var k = 0;
    while (str[k] == " ") {
      ++k;
    }
    return k;
  }


  /**
   * Returns an array of dictionnary. The format is the one returned by
   * this.getLineInfo()
   * @param {number} index
   * @return {dict}
   */
  getListItems(index) {
    var list = [];
    var item = this.getLineInfo(index);
    if (this.isListElement(item.str)) {
      list.push(item);

      // Items above
      for (var k = index - 1; k > 0; --k) {
        item = this.getLineInfo(k);
        if (this.isListElement(item.str)) {
          list.unshift(item);
        } else {
          break;
        }
      }

      // Items under
      for (var k = index + 1; k < this.cm.doc.lastLine(); ++k) {
        item = this.getLineInfo(k);
        if (this.isListElement(item.str)) {
          list.push(item);
        } else {
          break;
        }
      }
    }
    return list;
  }

  /**
   * Returns the new index where the cursor should be.
   * Assuming destIdx exists. Check setDestIdx() for more details.
   * @param {dict} data
   * @returns {number} - index number, -1 in case of error.
   */
  getCursorNewPos(data) {
    for (var k = 0; k < data.length; ++k) {
      if (data[k].cursor) return data[k].destIdx;
      if (data[k].subList.length > 0) {
        var idx = this.getCursorNewPos(data[k].subList);
        if (idx > -1) {
          return idx;
        }
      }
    }
    return -1;
  }


  /**
   * Organise the list of items by adding sublist attribute
   *
   * @param {array} list - List of strings
   * @param {number} level - level of indentation
   * @returns {array} - An array of dictionnary with the following format:
   *    "str": Content of the line
   *    "cursor": Boolean, if the cursor is on this line
   *    "srcIdx": index number to keep a trace
   *     level: The level of indentation
   *     sublist: Recursively, an array of dict for the sub list
   */
  createDataSet(list, level) {
    var data = [];

    // Case when the 1st item of the list is indented
    if (list.length > 0 && this.getElementLevel(list[0].str) != 0
        && level == 0) {
      list.unshift({ "str": "'", "cursor": false });
    }

    while (list.length > 0) {
      var currentLevel = this.getElementLevel(list[0].str);
      if ( currentLevel < level) {
        return data;
      }

      var lineInfo = list.shift();
      var subList = [];

      if (list.length > 0) {
        var nextLevel = this.getElementLevel(list[0].str);
        if (nextLevel > level) {
          subList = this.createDataSet(list, nextLevel);
        }
      }
      data.push(Object.assign(
        {}, lineInfo, {"level": currentLevel, "subList": subList,}));
    }
    return data;
  }


  /**
   * Sorts items in data.
   * @param {array} data - Array of dict
   * @param {number} sortType - SORT_ASC or SORT_DESC
   */
  sortData(data, sortType) {
    data.sort((a, b) => {
      const textA = a.str.toLowerCase();
      const textB = b.str.toLowerCase();
      if (textA < textB) return -1 * sortType;
      if (textA > textB) return sortType;
      return 0;
    });
    for (var k = 0; k < data.length; ++k) {
      if (data[k].subList.length > 0) {
        this.sortData(data[k].subList, sortType);
      }
    }
  }


  /**
   * Gathering all items from the dataset and returns a big string corresponding
   * to the whole list.
   * @param {array} data
   * @returns {string}
   */
  gatherData(data) {
    var list = "";
    for (var k = 0; k < data.length; ++k) {
      list += data[k].str + "\n";
      if (data[k].subList.length > 0) {
        list += this.gatherData(data[k].subList);
      }
    }
    return list;
  }


  /**
   * Improves the dataset by adding the new index position based on the current
   * order.
   * @param {array} data
   * @param {*} firstLine - Index where the list starts in the doc.
   * @returns
   */
  setDestIdx(data, firstLine) {
    for (var k = 0; k < data.length; ++k) {
      data[k].destIdx = firstLine;
      firstLine += 1;
      if (data[k].subList.length > 0) {
        firstLine = this.setDestIdx(data[k].subList, firstLine);
      }
    }
    return firstLine;
  }


  /**
   * Main command to be called to sort the list where the cursor is.
   * @param {number} sortType - SORT_ASC or SORT_DESC
   */
  sortList(sortType) {
    var cursorInfo = this.cm.doc.getCursor(true);
    var listInfo = this.getListItems(cursorInfo.line);
    if (listInfo.length > 0) {
      const firstLine = listInfo[0].srcIdx;
      const lastLine = listInfo.at(-1).srcIdx;
      var data = this.createDataSet(listInfo, 0);

      // Keep intended sublist without parent at the top
      if (data[0].str == "'" && sortType == SORT_DESC) {
        data[0].str = "_";
        cursorInfo.line -= 1;
      }

      this.sortData(data, sortType);
      this.setDestIdx(data, firstLine);
      var cursorIdx = this.getCursorNewPos(data);
      data = this.gatherData(data);

      // Case when the first item is already intended and not a sub-list
      if (data[0] == "'" || data[0] == "_") {
        data = data.slice(2);
        cursorIdx -= 1;
      }

      this.cm.doc.replaceRange(
        data,
        new Pos(firstLine, 0),
        new Pos(lastLine + 1, 0),
      );
      this.cm.doc.setSelection(new Pos(cursorIdx, cursorInfo.ch));
    }
  }


  registerCommand(command, callback) {
    const targetElement = this.cm.display.wrapper;
    this.subscriptions.add(
      inkdrop.commands.add(targetElement, {
        [`${NAMESPACE}:${command}`]: () => {
          callback();
        },
      })
    );
  }


  destroy() {
    this.subscriptions.dispose();
  }

}
