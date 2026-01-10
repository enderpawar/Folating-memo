import SettingsWindow from './SettingsWindow'
import OverlayWindow from './OverlayWindow'

function App() {
  // URL 파라미터로 어떤 창인지 확인
  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window');

  if (windowType === 'settings') {
    return <SettingsWindow />;
  } else if (windowType === 'overlay') {
    return <OverlayWindow />;
  }

  // 기본값 (브라우저에서 직접 열었을 때)
  return <SettingsWindow />;
}

export default App;