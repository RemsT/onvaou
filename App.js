import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigatorSimple';

export default function App() {
  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
