# List Sorter
![](https://inkdrop-plugin-badge.vercel.app/api/version/list-sorter)
![](https://inkdrop-plugin-badge.vercel.app/api/downloads/list-sorter)

### Definition

Sort the list where the cursor is, in ascending or descending order.

- List's items are detected by the markdown specific characters:  ```-, + or *```
- The plugin is not considering empty lines OR lines not starting with the allowed symbols.
- The algorithm follows the initial order of your list's items to detect and keep sub lists.
- Not case-sensitive.

### Examples
| Initial List                                                                                           | Sort Ascending                                                                                     | Sort Descending                                                                                     |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ![Screenshot](https://raw.githubusercontent.com/ezLimon/inkdrop_list-sorter/master/images/initial.png) | ![Screenshot](https://raw.githubusercontent.com/ezLimon/inkdrop_list-sorter/master/images/asc.png) | ![Screenshot](https://raw.githubusercontent.com/ezLimon/inkdrop_list-sorter/master/images/desc.png) | 


### Keybindings
| Command                | Keys                                       |
| ---------------------- | ------------------------------------------ |
| list-sorter:ascending  | ```Ctrl``` + ```Atl/Option``` + ```Down``` |
| list-sorter:descending | ```Ctrl``` + ```Alt/Option``` + ```Up```   |

You can also find the options by right clicing on the note and under the **Plugins** option.

### Installation
```
ipm install list-sorter
```
