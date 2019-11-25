/**
 * @format
 */
/**
 * Fix crash in production.It doesn't crash in debug build.
 * import 'react-native-gesture-handler';
 * https://github.com/kmagiera/react-native-gesture-handler/issues/783
 * https://github.com/kmagiera/react-native-gesture-handler/issues/320#issuecomment-554617639
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
