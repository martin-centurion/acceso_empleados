import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  Html5QrcodeScannerStrings,
  Html5QrcodeStrings,
  LibraryInfoStrings,
} from 'html5-qrcode/esm/strings.js';
import QRCode from 'qrcode';
import api, { setAdminToken } from './api';

let scannerStringsReady = false;

const ensureScannerSpanish = () => {
  if (scannerStringsReady) {
    return;
  }

  Html5QrcodeScannerStrings.scanningStatus = () => 'Escaneando';
  Html5QrcodeScannerStrings.idleStatus = () => 'En espera';
  Html5QrcodeScannerStrings.errorStatus = () => 'Error';
  Html5QrcodeScannerStrings.permissionStatus = () => 'Permisos';
  Html5QrcodeScannerStrings.noCameraFoundErrorStatus = () => 'Sin camaras';
  Html5QrcodeScannerStrings.lastMatch = (decodedText) => `Ultimo codigo: ${decodedText}`;
  Html5QrcodeScannerStrings.codeScannerTitle = () => 'Escaner';
  Html5QrcodeScannerStrings.cameraPermissionTitle = () => 'Permisos de camara';
  Html5QrcodeScannerStrings.cameraPermissionRequesting = () => 'Solicitando permisos de camara...';
  Html5QrcodeScannerStrings.noCameraFound = () => 'No se encontro camara';
  Html5QrcodeScannerStrings.scanButtonStopScanningText = () => 'Detener';
  Html5QrcodeScannerStrings.scanButtonStartScanningText = () => 'Iniciar';
  Html5QrcodeScannerStrings.torchOnButton = () => 'Encender linterna';
  Html5QrcodeScannerStrings.torchOffButton = () => 'Apagar linterna';
  Html5QrcodeScannerStrings.torchOnFailedMessage = () => 'No se pudo encender la linterna';
  Html5QrcodeScannerStrings.torchOffFailedMessage = () => 'No se pudo apagar la linterna';
  Html5QrcodeScannerStrings.scanButtonScanningStarting = () => 'Iniciando camara...';
  Html5QrcodeScannerStrings.textIfCameraScanSelected = () => 'Escanear una imagen';
  Html5QrcodeScannerStrings.textIfFileScanSelected = () => 'Escanear con camara';
  Html5QrcodeScannerStrings.selectCamera = () => 'Seleccionar camara';
  Html5QrcodeScannerStrings.fileSelectionChooseImage = () => 'Elegir imagen';
  Html5QrcodeScannerStrings.fileSelectionChooseAnother = () => 'Elegir otra';
  Html5QrcodeScannerStrings.fileSelectionNoImageSelected = () => 'Sin imagen seleccionada';
  Html5QrcodeScannerStrings.anonymousCameraPrefix = () => 'Camara';
  Html5QrcodeScannerStrings.dragAndDropMessage = () => 'O solta una imagen para escanear';
  Html5QrcodeScannerStrings.dragAndDropMessageOnlyImages = () =>
    'O solta una imagen para escanear (solo imagenes)';
  Html5QrcodeScannerStrings.zoom = () => 'Zoom';
  Html5QrcodeScannerStrings.loadingImage = () => 'Cargando imagen...';
  Html5QrcodeScannerStrings.cameraScanAltText = () => 'Escaneo por camara';
  Html5QrcodeScannerStrings.fileScanAltText = () => 'Escaneo por archivo';

  Html5QrcodeStrings.codeParseError = (exception) => `Error al leer el QR: ${exception}`;
  Html5QrcodeStrings.errorGettingUserMedia = (error) => `Error al acceder a la camara: ${error}`;
  Html5QrcodeStrings.onlyDeviceSupportedError = () =>
    'El dispositivo no soporta navigator.mediaDevices.';
  Html5QrcodeStrings.cameraStreamingNotSupported = () =>
    'El navegador no soporta streaming de camara.';
  Html5QrcodeStrings.unableToQuerySupportedDevices = () =>
    'No se pudieron consultar los dispositivos.';
  Html5QrcodeStrings.insecureContextCameraQueryError = () =>
    'La camara requiere HTTPS o localhost.';
  Html5QrcodeStrings.scannerPaused = () => 'Escaner en pausa';

  LibraryInfoStrings.poweredBy = () => 'Hecho con ';
  LibraryInfoStrings.reportIssues = () => 'Reportar problemas';

  scannerStringsReady = true;
};

function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/check" element={<CheckPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

function HomePage() {
  return (
    <div className="page home">
      <header className="home-hero">
        <div className="home-logo" aria-hidden="true"></div>
        <h1>Nombre Empresa</h1>
        <p>Registro de ingreso/egreso personal</p>
        <div className="home-actions">
          <Link className="home-action-card" to="/scan">
            <span className="home-action-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M160 224L224 224L224 160L160 160L160 224zM96 144C96 117.5 117.5 96 144 96L240 96C266.5 96 288 117.5 288 144L288 240C288 266.5 266.5 288 240 288L144 288C117.5 288 96 266.5 96 240L96 144zM160 480L224 480L224 416L160 416L160 480zM96 400C96 373.5 117.5 352 144 352L240 352C266.5 352 288 373.5 288 400L288 496C288 522.5 266.5 544 240 544L144 544C117.5 544 96 522.5 96 496L96 400zM416 160L416 224L480 224L480 160L416 160zM400 96L496 96C522.5 96 544 117.5 544 144L544 240C544 266.5 522.5 288 496 288L400 288C373.5 288 352 266.5 352 240L352 144C352 117.5 373.5 96 400 96zM384 416C366.3 416 352 401.7 352 384C352 366.3 366.3 352 384 352C401.7 352 416 366.3 416 384C416 401.7 401.7 416 384 416zM384 480C401.7 480 416 494.3 416 512C416 529.7 401.7 544 384 544C366.3 544 352 529.7 352 512C352 494.3 366.3 480 384 480zM480 512C480 494.3 494.3 480 512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544C494.3 544 480 529.7 480 512zM512 416C494.3 416 480 401.7 480 384C480 366.3 494.3 352 512 352C529.7 352 544 366.3 544 384C544 401.7 529.7 416 512 416zM480 448C480 465.7 465.7 480 448 480C430.3 480 416 465.7 416 448C416 430.3 430.3 416 448 416C465.7 416 480 430.3 480 448z" />
              </svg>
            </span>
            Escanear QR
          </Link>
          <Link className="home-action-card" to="/admin">
            <span className="home-action-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M416 160L480 160C497.7 160 512 174.3 512 192L512 448C512 465.7 497.7 480 480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L480 544C533 544 576 501 576 448L576 192C576 139 533 96 480 96L416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160zM406.6 342.6C419.1 330.1 419.1 309.8 406.6 297.3L278.6 169.3C266.1 156.8 245.8 156.8 233.3 169.3C220.8 181.8 220.8 202.1 233.3 214.6L306.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L306.7 352L233.3 425.4C220.8 437.9 220.8 458.2 233.3 470.7C245.8 483.2 266.1 483.2 278.6 470.7L406.6 342.7z" />
              </svg>
            </span>
            Acceso Administrador
          </Link>
        </div>
      </header>

      <section className="home-features">
        <article className="home-feature">
          <h3>Ingreso inmediato</h3>
          <p>
            El empleado escanea el QR de la sucursal y marca su entrada o salida
            en segundos.
          </p>
        </article>
        <article className="home-feature">
          <h3>Geolocalizacion</h3>
          <p>
            Guarda la ubicacion y la precision para validar registros en el
            establecimiento.
          </p>
        </article>
        <article className="home-feature">
          <h3>Reportes</h3>
          <p>
            Exporta CSV con filtros por fecha, empleado y sucursal para auditoria.
          </p>
        </article>
      </section>
    </div>
  );
}

function CheckPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialToken = query.get('token') || query.get('t') || '';

  const [token, setToken] = useState(initialToken);
  const [branch, setBranch] = useState(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [pin, setPin] = useState('');
  const [action, setAction] = useState('AUTO');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [geo, setGeo] = useState({
    status: 'idle',
    coords: null,
    error: '',
  });

  useEffect(() => {
    if (!token) {
      setBranch(null);
      return;
    }

    api
      .get('/public/branch-info', { params: { token } })
      .then((response) => {
        setBranch(response.data.branch);
      })
      .catch(() => {
        setBranch(null);
      });
  }, [token]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeo({ status: 'error', coords: null, error: 'Geolocalizacion no disponible' });
      return;
    }

    setGeo({ status: 'loading', coords: null, error: '' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ status: 'ready', coords: position.coords, error: '' });
      },
      (geoError) => {
        setGeo({
          status: 'error',
          coords: null,
          error: geoError.message || 'No se pudo obtener ubicacion',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const response = await api.post('/public/check', {
        token,
        employee_code: employeeCode,
        pin: pin || undefined,
        action,
        device_time: new Date().toISOString(),
        lat: geo.coords?.latitude,
        lng: geo.coords?.longitude,
        accuracy: geo.coords?.accuracy,
      });

      setStatus({
        action: response.data.action,
        event_time: response.data.event_time,
        employee: response.data.employee,
        branch: response.data.branch,
      });
      setEmployeeCode('');
      setPin('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  const locationLabel = useMemo(() => {
    if (geo.status === 'loading') return 'Buscando ubicacion...';
    if (geo.status === 'error') return geo.error;
    if (!geo.coords) return 'Sin ubicacion';
    return `Ubicacion OK (${geo.coords.latitude.toFixed(5)}, ${geo.coords.longitude.toFixed(5)})`;
  }, [geo]);

  return (
    <div className="page mobile">
      <header className="page-header">
        <div>
          <span className="eyebrow">Marcacion</span>
          <h2>Ingreso / egreso</h2>
          <p>Usa el QR de la sucursal para registrar tu jornada.</p>
        </div>
        <button className="btn ghost" type="button" onClick={() => navigate('/')}>
          <span className="btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" />
            </svg>
          </span>
          Volver
        </button>
      </header>

      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Token de sucursal</label>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Token del QR"
            />
            <small>
              {token
                ? branch
                  ? `Sucursal: ${branch.name}`
                  : 'Sucursal no encontrada'
                : 'Ingresa un token del QR'}
            </small>
          </div>
          <div className="field">
            <label>Codigo empleado</label>
            <input
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value)}
              placeholder="Ej: EMP-001"
              required
            />
          </div>
          <div className="field">
            <label>PIN (si aplica)</label>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="PIN"
              type="password"
            />
          </div>
          <div className="field">
            <label>Tipo de marca</label>
            <div className="pill-group">
              {['AUTO', 'IN', 'OUT'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={action === option ? 'pill active' : 'pill'}
                  onClick={() => setAction(option)}
                >
                  {option === 'AUTO' ? 'Auto' : option === 'IN' ? 'Ingreso' : 'Egreso'}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Geolocalizacion</label>
            <div className="geo-row">
              <span>{locationLabel}</span>
              <button
                type="button"
                className="btn ghost"
                onClick={requestGeolocation}
              >
                Reintentar
              </button>
            </div>
          </div>
          {error && <div className="notice error">{error}</div>}
          {status && (
            <div className="notice success">
              Registro {status.action} OK para {status.employee.full_name}.
            </div>
          )}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
      </section>
    </div>
  );
}

function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanIconSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M160 224L224 224L224 160L160 160L160 224zM96 144C96 117.5 117.5 96 144 96L240 96C266.5 96 288 117.5 288 144L288 240C288 266.5 266.5 288 240 288L144 288C117.5 288 96 266.5 96 240L96 144zM160 480L224 480L224 416L160 416L160 480zM96 400C96 373.5 117.5 352 144 352L240 352C266.5 352 288 373.5 288 400L288 496C288 522.5 266.5 544 240 544L144 544C117.5 544 96 522.5 96 496L96 400zM416 160L416 224L480 224L480 160L416 160zM400 96L496 96C522.5 96 544 117.5 544 144L544 240C544 266.5 522.5 288 496 288L400 288C373.5 288 352 266.5 352 240L352 144C352 117.5 373.5 96 400 96zM384 416C366.3 416 352 401.7 352 384C352 366.3 366.3 352 384 352C401.7 352 416 366.3 416 384C416 401.7 401.7 416 384 416zM384 480C401.7 480 416 494.3 416 512C416 529.7 401.7 544 384 544C366.3 544 352 529.7 352 512C352 494.3 366.3 480 384 480zM480 512C480 494.3 494.3 480 512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544C494.3 544 480 529.7 480 512zM512 416C494.3 416 480 401.7 480 384C480 366.3 494.3 352 512 352C529.7 352 544 366.3 544 384C544 401.7 529.7 416 512 416zM480 448C480 465.7 465.7 480 448 480C430.3 480 416 465.7 416 448C416 430.3 430.3 416 448 416C465.7 416 480 430.3 480 448z"/></svg>';
    const scanIconData = `data:image/svg+xml,${encodeURIComponent(scanIconSvg)}`;

    const extractTokenFromUrl = (value) => {
      try {
        const url = new URL(value);
        let token = url.searchParams.get('token') || url.searchParams.get('t');
        if (!token && url.hash) {
          const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
          const queryIndex = hash.indexOf('?');
          if (queryIndex !== -1) {
            const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
            token = hashParams.get('token') || hashParams.get('t');
          }
        }
        return token;
      } catch (err) {
        return null;
      }
    };

    const applyScanIcon = () => {
      const scanRegion = document.getElementById('qr-reader__scan_region');
      if (!scanRegion) return;
      const icon = scanRegion.querySelector('img');
      if (icon && icon.src !== scanIconData) {
        icon.src = scanIconData;
        icon.alt = 'Icono de escaneo';
      }
    };

    ensureScannerSpanish();

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        videoConstraints: { facingMode: 'environment' },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        const token = extractTokenFromUrl(decodedText);
        if (token) {
          navigate(`/check?token=${token}`);
          return;
        }
        if (/^[0-9a-fA-F-]{36}$/.test(decodedText)) {
          navigate(`/check?token=${decodedText}`);
          return;
        }
      },
      () => {}
    );

    scannerRef.current = scanner;
    applyScanIcon();
    const observer = new MutationObserver(applyScanIcon);
    const scanRegion = document.getElementById('qr-reader__scan_region');
    if (scanRegion) {
      observer.observe(scanRegion, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      scanner
        .clear()
        .catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="page mobile">
      <header className="page-header">
        <div>
          <span className="eyebrow">Escaneo</span>
          <h2>Leer QR de sucursal</h2>
          <p>Apunta la camara para abrir la marca de ingreso.</p>
        </div>
        <Link className="btn ghost" to="/">
          <span className="btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" />
            </svg>
          </span>
          Volver
        </Link>
      </header>
      <section className="panel">
        <div className="notice info notice-with-icon">
          <span className="notice-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 384C302.3 384 288 398.3 288 416C288 433.7 302.3 448 320 448C337.7 448 352 433.7 352 416C352 398.3 337.7 384 320 384zM320 192C301.8 192 287.3 207.5 288.6 225.7L296 329.7C296.9 342.3 307.4 352 319.9 352C332.5 352 342.9 342.3 343.8 329.7L351.2 225.7C352.5 207.5 338.1 192 319.8 192z" />
            </svg>
          </span>
          Para escanear, habilita el permiso de camara en tu navegador.
        </div>
        <div id="qr-reader" className="qr-box"></div>
      </section>
    </div>
  );
}

function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  const handleLogout = () => {
    setAdminToken(null);
    setToken(null);
  };

  if (!token) {
    return <AdminLogin onLogin={setToken} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminLogin({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/login', { passcode });
      setAdminToken(response.data.token);
      onLogin(response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login invalido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page mobile">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2>Acceso admin</h2>
          <p>Ingresa el passcode para gestionar empleados y reportes.</p>
        </div>
        <Link className="btn ghost" to="/">
          <span className="btn-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M169.4 297.4C156.9 309.9 156.9 330.2 169.4 342.7L361.4 534.7C373.9 547.2 394.2 547.2 406.7 534.7C419.2 522.2 419.2 501.9 406.7 489.4L237.3 320L406.6 150.6C419.1 138.1 419.1 117.8 406.6 105.3C394.1 92.8 373.8 92.8 361.3 105.3L169.3 297.3z" />
            </svg>
          </span>
          Volver
        </Link>
      </header>
      <section className="panel">
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Passcode</label>
            <input
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              type="password"
              placeholder="Passcode"
              required
            />
          </div>
          {error && <div className="notice error">{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');

  const loadEmployees = async () => {
    const response = await api.get('/employees');
    const list = Array.isArray(response.data?.employees) ? response.data.employees : [];
    setEmployees(list);
  };

  const loadBranches = async () => {
    const response = await api.get('/branches');
    const list = Array.isArray(response.data?.branches) ? response.data.branches : [];
    setBranches(list);
  };

  const loadEvents = async (params) => {
    const response = await api.get('/reports/attendance', { params });
    const list = Array.isArray(response.data?.events) ? response.data.events : [];
    setEvents(list);
  };

  useEffect(() => {
    loadEmployees().catch(() => {});
    loadBranches().catch(() => {});
    loadEvents({ limit: 50 }).catch(() => {});
  }, []);

  const handleStatus = (message) => {
    setStatus(message);
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <div className="page admin">
      <header className="page-header">
        <div>
          <span className="eyebrow">Panel admin</span>
          <h2>Gestion de personal</h2>
          <p>Administra empleados, sucursales y reportes.</p>
        </div>
        <div className="header-actions">
          {status && <span className="status-pill">{status}</span>}
          <button className="btn ghost" type="button" onClick={onLogout}>
            <span className="btn-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C221.6 240.4 221.6 255.6 231 264.9L286 319.9L231 374.9C221.6 384.3 221.6 399.5 231 408.8C240.4 418.1 255.6 418.2 264.9 408.8L319.9 353.8L374.9 408.8C384.3 418.2 399.5 418.2 408.8 408.8C418.1 399.4 418.2 384.2 408.8 374.9L353.8 319.9L408.8 264.9C418.2 255.5 418.2 240.3 408.8 231C399.4 221.7 384.2 221.6 374.9 231L319.9 286L264.9 231C255.5 221.6 240.3 221.6 231 231z" />
              </svg>
            </span>
            Salir
          </button>
        </div>
      </header>

      <div className="tab-bar">
        <button
          className={activeTab === 'employees' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('employees')}
          type="button"
        >
          Empleados
        </button>
        <button
          className={activeTab === 'branches' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('branches')}
          type="button"
        >
          Sucursales
        </button>
        <button
          className={activeTab === 'reports' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('reports')}
          type="button"
        >
          Reportes
        </button>
      </div>

      {activeTab === 'employees' && (
        <EmployeesPanel
          employees={Array.isArray(employees) ? employees : []}
          onRefresh={() => loadEmployees()}
          onStatus={handleStatus}
        />
      )}
      {activeTab === 'branches' && (
        <BranchesPanel
          branches={Array.isArray(branches) ? branches : []}
          onRefresh={() => loadBranches()}
          onStatus={handleStatus}
        />
      )}
      {activeTab === 'reports' && (
        <ReportsPanel
          events={Array.isArray(events) ? events : []}
          employees={Array.isArray(employees) ? employees : []}
          branches={Array.isArray(branches) ? branches : []}
          onRefresh={(params) => loadEvents(params)}
        />
      )}
    </div>
  );
}

function EmployeesPanel({ employees, onRefresh, onStatus }) {
  const [form, setForm] = useState({
    code: '',
    full_name: '',
    phone: '',
    hire_date: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const formatDate = (value) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/employees', form);
      setForm({ code: '', full_name: '', phone: '', hire_date: '', pin: '' });
      await onRefresh();
      onStatus('Empleado creado');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (employee) => {
    if (employee.is_active) {
      const today = new Date().toISOString().slice(0, 10);
      const date = window.prompt('Fecha de baja (YYYY-MM-DD)', employee.termination_date || today);
      if (date === null) return;
      await api.patch(`/employees/${employee.id}`, {
        is_active: false,
        termination_date: date || null,
      });
    } else {
      await api.patch(`/employees/${employee.id}`, {
        is_active: true,
        termination_date: null,
      });
    }
    await onRefresh();
    setSelectedEmployee(null);
  };

  const handleEdit = async (employee) => {
    const name = window.prompt('Nombre completo', employee.full_name);
    if (name === null) return;
    const phone = window.prompt('Telefono de contacto', employee.phone || '');
    if (phone === null) return;
    const hireDate = window.prompt('Fecha de ingreso (YYYY-MM-DD)', employee.hire_date || '');
    if (hireDate === null) return;
    await api.patch(`/employees/${employee.id}`, {
      full_name: name,
      phone: phone || null,
      hire_date: hireDate || null,
    });
    await onRefresh();
    setSelectedEmployee(null);
  };

  const handlePin = async (employee) => {
    const pin = window.prompt('Nuevo PIN (vacio para quitar)', '');
    if (pin === null) return;
    await api.patch(`/employees/${employee.id}`, { pin: pin || null });
    await onRefresh();
    setSelectedEmployee(null);
  };

  const handleDelete = async (employee) => {
    const ok = window.confirm(`Eliminar empleado ${employee.full_name}?`);
    if (!ok) return;
    try {
      await api.delete(`/employees/${employee.id}`);
      await onRefresh();
      onStatus('Empleado eliminado');
      setSelectedEmployee(null);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  return (
    <section className="panel">
      <div className="split">
        <form className="form" onSubmit={handleCreate}>
          <h3>Nuevo empleado</h3>
          <div className="field">
            <label>Codigo</label>
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Nombre completo</label>
            <input
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Telefono de contacto</label>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              type="tel"
            />
          </div>
          <div className="field">
            <label>Fecha de ingreso</label>
            <input
              value={form.hire_date}
              onChange={(event) => setForm({ ...form, hire_date: event.target.value })}
              type="date"
            />
          </div>
          <div className="field">
            <label>PIN (opcional)</label>
            <input
              value={form.pin}
              onChange={(event) => setForm({ ...form, pin: event.target.value })}
            />
          </div>
          {error && <div className="notice error">{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Crear'}
          </button>
        </form>

        <div className="data-list">
          <h3>Empleados</h3>
          {employees.length === 0 ? (
            <p className="muted">No hay empleados cargados.</p>
          ) : (
            <div className="data-cards">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  className="data-card"
                  type="button"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <span className="data-card-title">{employee.full_name}</span>
                  <span className="data-card-meta">Codigo: {employee.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEmployee && (
        <div className="modal-backdrop" onClick={() => setSelectedEmployee(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Empleado</span>
                <h3>{selectedEmployee.full_name}</h3>
              </div>
              <button className="btn ghost" type="button" onClick={() => setSelectedEmployee(null)}>
                Cerrar
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Codigo</span>
                <strong>{selectedEmployee.code}</strong>
              </div>
              <div className="detail-item">
                <span>Telefono</span>
                <strong>{selectedEmployee.phone || '-'}</strong>
              </div>
              <div className="detail-item">
                <span>Ingreso</span>
                <strong>{formatDate(selectedEmployee.hire_date)}</strong>
              </div>
              <div className="detail-item">
                <span>Baja</span>
                <strong>{formatDate(selectedEmployee.termination_date)}</strong>
              </div>
              <div className="detail-item">
                <span>Estado</span>
                <strong>{selectedEmployee.is_active ? 'Activo' : 'Inactivo'}</strong>
              </div>
            </div>
            <div className="actions modal-actions">
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleToggle(selectedEmployee)}
              >
                {selectedEmployee.is_active ? 'Dar de baja' : 'Reactivar'}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleEdit(selectedEmployee)}
              >
                Editar
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handlePin(selectedEmployee)}
              >
                PIN
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleDelete(selectedEmployee)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function BranchesPanel({ branches, onRefresh, onStatus }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [detailQrUrl, setDetailQrUrl] = useState('');
  const [detailQrImage, setDetailQrImage] = useState('');

  const appUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

  const closeBranchModal = () => {
    setSelectedBranch(null);
    setDetailQrUrl('');
    setDetailQrImage('');
  };

  const buildBranchQr = async (branch) => {
    const url = `${appUrl}/#/check?token=${branch.qr_token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 1 });
    setDetailQrUrl(url);
    setDetailQrImage(dataUrl);
    return { url, dataUrl };
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/branches', { name });
      setName('');
      await onRefresh();
      onStatus('Sucursal creada');
      const url = `${appUrl}/#/check?token=${response.data.branch.qr_token}`;
      setQrUrl(url);
      const dataUrl = await QRCode.toDataURL(url, { width: 220, margin: 1 });
      setQrImage(dataUrl);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (branch) => {
    await api.patch(`/branches/${branch.id}`, { is_active: !branch.is_active });
    await onRefresh();
    closeBranchModal();
  };

  const handleShowBranchQr = async (branch) => {
    await buildBranchQr(branch);
  };

  const handleDownloadBranchQr = async (branch) => {
    const { dataUrl } = await buildBranchQr(branch);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${branch.name || 'sucursal'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async (branch) => {
    const ok = window.confirm(`Eliminar sucursal ${branch.name}?`);
    if (!ok) return;
    setError('');
    try {
      await api.delete(`/branches/${branch.id}`);
      await onRefresh();
      onStatus('Sucursal eliminada');
      closeBranchModal();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar');
    }
  };

  const handleSelectBranch = async (branch) => {
    setSelectedBranch(branch);
    try {
      await handleShowBranchQr(branch);
    } catch (err) {
      setDetailQrUrl('');
      setDetailQrImage('');
    }
  };

  return (
    <section className="panel">
      <div className="split">
        <form className="form" onSubmit={handleCreate}>
          <h3>Nueva sucursal</h3>
          <div className="field">
            <label>Nombre</label>
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          {error && <div className="notice error">{error}</div>}
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear'}
          </button>
          {qrUrl && (
            <div className="qr-preview">
              <p>QR generado:</p>
              <img src={qrImage} alt="QR sucursal" />
              <small>{qrUrl}</small>
            </div>
          )}
        </form>

        <div className="data-list">
          <h3>Sucursales</h3>
          {branches.length === 0 ? (
            <p className="muted">No hay sucursales cargadas.</p>
          ) : (
            <div className="data-cards">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  className="data-card"
                  type="button"
                  onClick={() => handleSelectBranch(branch)}
                >
                  <span className="data-card-title">{branch.name}</span>
                  <span className="data-card-meta">
                    Estado: {branch.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBranch && (
        <div className="modal-backdrop" onClick={closeBranchModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Sucursal</span>
                <h3>{selectedBranch.name}</h3>
              </div>
              <button className="btn ghost" type="button" onClick={closeBranchModal}>
                Cerrar
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Estado</span>
                <strong>{selectedBranch.is_active ? 'Activa' : 'Inactiva'}</strong>
              </div>
              <div className="detail-item">
                <span>Token QR</span>
                <strong className="mono">{selectedBranch.qr_token}</strong>
              </div>
            </div>
            <div className="qr-preview">
              <p>QR para registrar:</p>
              {detailQrImage ? (
                <>
                  <img src={detailQrImage} alt="QR sucursal" />
                  <small className="mono">{detailQrUrl}</small>
                </>
              ) : (
                <small className="muted">Genera el QR para compartirlo.</small>
              )}
              <div className="qr-actions">
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => handleShowBranchQr(selectedBranch)}
                >
                  Ver QR
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => handleDownloadBranchQr(selectedBranch)}
                >
                  Descargar QR
                </button>
              </div>
            </div>
            <div className="actions modal-actions">
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleToggle(selectedBranch)}
              >
                {selectedBranch.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleDelete(selectedBranch)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReportsPanel({ events, employees, branches, onRefresh }) {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    employee_code: '',
    branch_id: '',
  });
  const [loading, setLoading] = useState(false);

  const formatAction = (value) => {
    if (value === 'IN') return 'Ingreso';
    if (value === 'OUT') return 'Salida';
    return value || '-';
  };

  const handleApply = async () => {
    await onRefresh({ ...filters, limit: 50 });
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/attendance.csv', {
        params: filters,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="filters">
        <div className="field">
          <label>Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters({ ...filters, from: event.target.value })}
          />
        </div>
        <div className="field">
          <label>Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters({ ...filters, to: event.target.value })}
          />
        </div>
        <div className="field">
          <label>Empleado</label>
          <select
            value={filters.employee_code}
            onChange={(event) => setFilters({ ...filters, employee_code: event.target.value })}
          >
            <option value="">Todos</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.code}>
                {employee.code} - {employee.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Sucursal</label>
          <select
            value={filters.branch_id}
            onChange={(event) => setFilters({ ...filters, branch_id: event.target.value })}
          >
            <option value="">Todas</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn ghost" type="button" onClick={handleApply}>
            Aplicar
          </button>
          <button className="btn primary" type="button" onClick={handleDownload} disabled={loading}>
            {loading ? 'Descargando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <h3>Ultimos registros</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Accion</th>
              <th>Empleado</th>
              <th>Sucursal</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.event_time).toLocaleString()}</td>
                <td>{formatAction(event.action)}</td>
                <td>{event.employee_code} - {event.full_name}</td>
                <td>{event.branch_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default App;
