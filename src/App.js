import React, { useEffect, useState, useMemo, useRef } from 'react';

// --- COMPONENTE CANVAS 2D DE ALTA PERFORMANCE ---
const MainSimulationCanvas = React.memo(function MainSimulationCanvas({
  R,
  r,
  theta,
  xHipo,
  yHipo,
  mostrarVetores,
  acompanharPonto,
  tracarTrajetoria,
  ds_dtheta,
  Tx_var,
  Ty_var,
  Nx_var,
  Ny_var,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Fundo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Geometria atual
    const k = (R - r) / r;
    const xCentro = (R - r) * Math.cos(theta);
    const yCentro = (R - r) * Math.sin(theta);
    const xP = (R - r) * Math.cos(theta) + r * Math.cos(k * theta);
    const yP = (R - r) * Math.sin(theta) - r * Math.sin(k * theta);

    // Limites de visualização
    let viewCenterX = 0;
    let viewCenterY = 0;
    let delta = R * 1.25;

    if (acompanharPonto) {
      viewCenterX = xP;
      viewCenterY = yP;
      delta = Math.max(r * 2.5, 2);
    }

    const scale = Math.min(width, height) / (2 * delta);
    const centerX = width / 2;
    const centerY = height / 2;

    const toCanvasX = (x) => centerX + (x - viewCenterX) * scale;
    const toCanvasY = (y) => centerY - (y - viewCenterY) * scale;

    // Grelha
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridStep = delta / 4;
    for (let x = -delta * 2; x <= delta * 2; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(x));
      ctx.lineTo(width, toCanvasY(x));
      ctx.stroke();
    }

    // Eixos X e Y
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(width, toCanvasY(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), height);
    ctx.stroke();

    // 1. Aro Externo
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(0), R * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // 2. Trajetória da Hipocicloide
    if (tracarTrajetoria) {
      if (theta > 0) {
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 2.5;
        const numPontos = Math.max(2, Math.ceil((theta / (2 * Math.PI)) * 400));
        const kCalc = (R - r) / r;

        ctx.beginPath();
        for (let i = 0; i <= numPontos; i++) {
          const ang = (theta * i) / numPontos;
          const x = (R - r) * Math.cos(ang) + r * Math.cos(kCalc * ang);
          const y = (R - r) * Math.sin(ang) - r * Math.sin(kCalc * ang);
          if (i === 0) ctx.moveTo(toCanvasX(x), toCanvasY(y));
          else ctx.lineTo(toCanvasX(x), toCanvasY(y));
        }
        ctx.stroke();
      }
    } else if (xHipo && xHipo.length > 0) {
      ctx.strokeStyle = '#0055ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(xHipo[0]), toCanvasY(yHipo[0]));
      for (let i = 1; i < xHipo.length; i++) {
        ctx.lineTo(toCanvasX(xHipo[i]), toCanvasY(yHipo[i]));
      }
      ctx.stroke();
    }

    // 3. Disco Móvel
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(toCanvasX(xCentro), toCanvasY(yCentro), r * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // 4. Raio CP
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xCentro), toCanvasY(yCentro));
    ctx.lineTo(toCanvasX(xP), toCanvasY(yP));
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Centro C
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(toCanvasX(xCentro), toCanvasY(yCentro), 4, 0, 2 * Math.PI);
    ctx.fill();

    // 6. Ponto P
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(toCanvasX(xP), toCanvasY(yP), 6, 0, 2 * Math.PI);
    ctx.fill();

    // 7. Versores de Frenet (Item 1.6)
    if (mostrarVetores && ds_dtheta > 1e-4) {
      const pxP = toCanvasX(xP);
      const pyP = toCanvasY(yP);

      // Tangente (verde)
      const pxT = toCanvasX(xP + Tx_var);
      const pyT = toCanvasY(yP + Ty_var);
      drawArrow(ctx, pxP, pyP, pxT, pyT, '#28a745', 'τ');

      // Normal (roxo)
      const pxN = toCanvasX(xP + Nx_var);
      const pyN = toCanvasY(yP + Ny_var);
      drawArrow(ctx, pxP, pyP, pxN, pyN, '#6f42c1', 'n');
    }
  }, [
    R,
    r,
    theta,
    xHipo,
    yHipo,
    mostrarVetores,
    acompanharPonto,
    tracarTrajetoria,
    ds_dtheta,
    Tx_var,
    Ty_var,
    Nx_var,
    Ny_var,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
      }}
    />
  );
});

function drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  const headlen = 8;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = 'bold 13px Arial';
    ctx.fillText(label, toX + 4, toY - 4);
  }
  ctx.restore();
}

function mdc(a, b) {
  const precisao = 1e-4;
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y > precisao) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export default function App() {
  const [R, setR] = useState(5);
  const [r, setRSub] = useState(2);

  const [inputR, setInputR] = useState('5');
  const [inputRSub, setInputRSub] = useState('2');

  const [theta, setTheta] = useState(0);
  const [animando, setAnimando] = useState(true);

  const [mostrarVetores, setMostrarVetores] = useState(true);
  const [acompanharPonto, setAcompanharPonto] = useState(false);
  const [tracarTrajetoria, setTracarTrajetoria] = useState(false);
  const [mostrarPainelInfo, setMostrarPainelInfo] = useState(true);

  const omega = Math.PI / 60;
  const tAtual = theta / omega;
  const [inputTempo, setInputTempo] = useState('0.00');

  useEffect(() => {
    setInputR(R.toString());
  }, [R]);

  useEffect(() => {
    setInputRSub(r.toString());
  }, [r]);

  useEffect(() => {
    if (!animando) {
      setInputTempo(tAtual.toFixed(2));
    }
  }, [animando, tAtual]);

  const maxTheta = useMemo(() => {
    if (r <= 0 || R <= 0 || r >= R) return 2 * Math.PI;
    const divisorComum = mdc(R, r);
    const q = r / divisorComum;
    return q * 2 * Math.PI;
  }, [R, r]);

  const maxTempo = maxTheta / omega;

  useEffect(() => {
    if (!animando) return;

    let animationFrameId;
    const step = 0.025;

    const animate = () => {
      setTheta((prevT) => {
        const novoT = prevT + step;
        return novoT >= maxTheta ? 0 : novoT;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [maxTheta, animando]);

  const { xHipo, yHipo } = useMemo(() => {
    const x = [];
    const y = [];
    const totalPontos = Math.max(600, Math.ceil((maxTheta / (2 * Math.PI)) * 400));
    const kCalc = (R - r) / r;

    for (let i = 0; i <= totalPontos; i++) {
      const angulo = (maxTheta * i) / totalPontos;
      x.push((R - r) * Math.cos(angulo) + r * Math.cos(kCalc * angulo));
      y.push((R - r) * Math.sin(angulo) - r * Math.sin(kCalc * angulo));
    }
    return { xHipo: x, yHipo: y };
  }, [R, r, maxTheta]);

  const k = (R - r) / r;

  // Derivadas e Cinemática no instante atual
  const dxdtheta = -(R - r) * Math.sin(theta) - (R - r) * Math.sin(k * theta);
  const dydtheta = (R - r) * Math.cos(theta) - (R - r) * Math.cos(k * theta);
  const ds_dtheta = Math.sqrt(dxdtheta ** 2 + dydtheta ** 2);

  // 1. VELOCIDADE
  const vx = -(R - r) * omega * (Math.sin(theta) + Math.sin(k * theta));
  const vy = (R - r) * omega * (Math.cos(theta) - Math.cos(k * theta));
  const v_mag = Math.sqrt(vx ** 2 + vy ** 2); // Módulo (v_t em coord. intrínsecas)

  // 2. ACELERAÇÃO
  const ax = -(R - r) * (omega ** 2) * (Math.cos(theta) + k * Math.cos(k * theta));
  const ay = -(R - r) * (omega ** 2) * (Math.sin(theta) - k * Math.sin(k * theta));
  const a_mag = Math.sqrt(ax ** 2 + ay ** 2);

  // Componentes Intrínsecas da Aceleração
  const a_tangencial = v_mag > 1e-6 ? (vx * ax + vy * ay) / v_mag : 0;
  const a_normal = Math.sqrt(Math.max(0, a_mag ** 2 - a_tangencial ** 2));

  // Versores de Frenet
  let Tx_var = 0, Ty_var = 0, Nx_var = 0, Ny_var = 0;
  const escalaVersor = 1.5;

  if (ds_dtheta > 1e-4) {
    const unitTx = dxdtheta / ds_dtheta;
    const unitTy = dydtheta / ds_dtheta;
    const sgn = (R - 2 * r) >= 0 ? 1 : -1;

    Tx_var = unitTx * escalaVersor;
    Ty_var = unitTy * escalaVersor;
    Nx_var = sgn * unitTy * escalaVersor;
    Ny_var = -sgn * unitTx * escalaVersor;
  }

  const denCurvatura = Math.abs(R - 2 * r);
  const raioCurvatura = denCurvatura > 1e-6
    ? (4 * r * (R - r) / denCurvatura) * Math.abs(Math.sin((R / (2 * r)) * theta))
    : Infinity;

  // Cálculo da Cinemática para os 3 Instantes Fixos Exigidos (Item 1.7)
  const instantesFixos = useMemo(() => {
    const calcularInstante = (t) => {
      const th = omega * t;
      const kLocal = (R - r) / r;

      // Velocidade
      const v_x = -(R - r) * omega * (Math.sin(th) + Math.sin(kLocal * th));
      const v_y = (R - r) * omega * (Math.cos(th) - Math.cos(kLocal * th));
      const v_m = Math.sqrt(v_x ** 2 + v_y ** 2); // v_t intrínseco

      // Aceleração
      const a_x = -(R - r) * (omega ** 2) * (Math.cos(th) + kLocal * Math.cos(kLocal * th));
      const a_y = -(R - r) * (omega ** 2) * (Math.sin(th) - kLocal * Math.sin(kLocal * th));
      const a_m = Math.sqrt(a_x ** 2 + a_y ** 2);

      // Componentes Intrínsecas da Aceleração
      const a_t = v_m > 1e-6 ? (v_x * a_x + v_y * a_y) / v_m : 0;
      const a_n = Math.sqrt(Math.max(0, a_m ** 2 - a_t ** 2));

      // Raio de Curvatura
      const den = Math.abs(R - 2 * r);
      const rho = den > 1e-6
        ? (4 * r * (R - r) / den) * Math.abs(Math.sin((R / (2 * r)) * th))
        : Infinity;

      return { t, th, v_x, v_y, v_m, a_x, a_y, a_m, a_t, a_n, rho };
    };

    return [10, 25, 50].map(calcularInstante);
  }, [R, r, omega]);

  const aplicarNovoR = () => {
    let valor = parseFloat(inputR);
    if (isNaN(valor) || valor <= 0.1) valor = 0.2;
    setR(valor);
    setInputR(valor.toString());
    if (r >= valor) {
      const novoRSub = Number(Math.max(0.1, valor - 0.1).toFixed(2));
      setRSub(novoRSub);
      setInputRSub(novoRSub.toString());
    }
  };

  const aplicarNovoRSub = () => {
    let valor = parseFloat(inputRSub);
    const limiteMaximo = Number((R - 0.1).toFixed(2));
    if (isNaN(valor) || valor <= 0) valor = 0.1;
    else if (valor >= R) valor = limiteMaximo;

    setRSub(valor);
    setInputRSub(valor.toString());
  };

  const aplicarNovoTempo = () => {
    let val = parseFloat(inputTempo);
    if (isNaN(val) || val < 0) val = 0;
    else if (val > maxTempo) val = maxTempo;

    setAnimando(false);
    setTheta(val * omega);
    setInputTempo(val.toFixed(2));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', width: '100%', boxSizing: 'border-box' }}>
      {/* PAINEL DE CONTROLES */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f0f4f8', padding: '12px', borderRadius: '8px' }}>
        <label>
          <strong>Raio do Aro (R):</strong>{' '}
          <input
            type="number"
            value={inputR}
            step="0.5"
            onChange={(e) => setInputR(e.target.value)}
            onBlur={aplicarNovoR}
            onKeyDown={(e) => e.key === 'Enter' && aplicarNovoR()}
            style={{ width: '60px', padding: '4px' }}
          />
        </label>

        <label>
          <strong>Raio do Disco (r):</strong>{' '}
          <input
            type="number"
            value={inputRSub}
            step="0.5"
            onChange={(e) => setInputRSub(e.target.value)}
            onBlur={aplicarNovoRSub}
            onKeyDown={(e) => e.key === 'Enter' && aplicarNovoRSub()}
            style={{ width: '60px', padding: '4px' }}
          />
        </label>

        <label>
          <strong>Instante t (s):</strong>{' '}
          <input
            type="number"
            value={inputTempo}
            step="0.5"
            onChange={(e) => setInputTempo(e.target.value)}
            onBlur={aplicarNovoTempo}
            onKeyDown={(e) => e.key === 'Enter' && aplicarNovoTempo()}
            style={{ width: '70px', padding: '4px' }}
          />
        </label>

        <button
          onClick={() => setAnimando(!animando)}
          style={{
            padding: '6px 12px',
            backgroundColor: animando ? '#ff4d4f' : '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {animando ? 'Pausar' : 'Iniciar'}
        </button>

        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={mostrarVetores}
            onChange={(e) => setMostrarVetores(e.target.checked)}
          />{' '}
          Exibir Versores de Frenet (Item 1.6)
        </label>

        <label style={{ cursor: 'pointer', color: '#0056b3', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={acompanharPonto}
            onChange={(e) => setAcompanharPonto(e.target.checked)}
          />{' '}
          Acompanhar Ponto P
        </label>

        <label style={{ cursor: 'pointer', color: '#dc3545', fontWeight: 'bold' }}>
          <input
            type="checkbox"
            checked={tracarTrajetoria}
            onChange={(e) => setTracarTrajetoria(e.target.checked)}
          />{' '}
          Gerar Trajetória ao Mover
        </label>

        <button
          onClick={() => setMostrarPainelInfo(!mostrarPainelInfo)}
          style={{
            padding: '6px 14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}
        >
          {mostrarPainelInfo ? 'Ocultar Informações' : 'Ver Informações'}
        </button>
      </div>

      {/* ÁREA PRINCIPAL DO SIMULADOR (CANVAS) E PAINEL LATERAL */}
      <div style={{ width: '100%', marginBottom: '25px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '20px', width: '100%', alignItems: 'flex-start', boxSizing: 'border-box' }}>
          <div style={{ flex: '1 1 0%', minWidth: 0, height: '620px', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
            <MainSimulationCanvas
              R={R}
              r={r}
              theta={theta}
              xHipo={xHipo}
              yHipo={yHipo}
              mostrarVetores={mostrarVetores}
              acompanharPonto={acompanharPonto}
              tracarTrajetoria={tracarTrajetoria}
              ds_dtheta={ds_dtheta}
              Tx_var={Tx_var}
              Ty_var={Ty_var}
              Nx_var={Nx_var}
              Ny_var={Ny_var}
            />
          </div>

          {mostrarPainelInfo && (
            <div style={{ flex: '0 0 420px', width: '420px', height: '620px', overflowY: 'auto', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
              {/* ITEM 1.5 - RAIO DE CURVATURA */}
              <section style={{ marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid #28a745', paddingBottom: '4px', color: '#28a745' }}>
                  1.5 Raio de Curvatura Instantâneo
                </h3>
                <p style={{ margin: '4px 0', fontSize: '0.85em' }}>
                  <strong>Fórmula:</strong> ρ(θ) = [4r(R-r) / |R-2r|] · |sin((R/2r)θ)|
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
                  <strong>θ:</strong> {theta.toFixed(3)} rad | <strong>t:</strong> {tAtual.toFixed(2)} s
                </p>
                <p style={{ margin: '4px 0', fontSize: '0.95em', color: '#28a745' }}>
                  <strong>Raio de Curvatura (ρ):</strong> {isFinite(raioCurvatura) ? raioCurvatura.toFixed(4) : '∞'} u.m.
                </p>
              </section>

              {/* ITEM 1.7 - CINEMÁTICA DETALHADA */}
              <section>
                <h3 style={{ borderBottom: '2px solid #dc3545', paddingBottom: '4px', color: '#dc3545', marginTop: 0 }}>
                  1.7 Cinemática (Cartesiana vs Intrínseca)
                </h3>
                <p style={{ fontSize: '0.82em', margin: '2px 0 10px 0', color: '#555' }}>
                  Com θ(t) = ωt e ω = π/60 rad/s (~0.0524 rad/s)
                </p>

                {/* CARTÃO DE ESTADO INSTANTÂNEO SELECIONADO */}
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #007bff' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.92em', color: '#007bff' }}>
                    Estado Atual (t = {tAtual.toFixed(2)} s):
                  </h4>

                  {/* VETOR VELOCIDADE */}
                  <div style={{ marginBottom: '8px', padding: '6px', backgroundColor: '#f0f7ff', borderRadius: '4px' }}>
                    <strong style={{ fontSize: '0.85em', color: '#0056b3' }}>VELOCIDADE (v):</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '0.82em' }}>
                      <li>
                        <strong>Cartesiana:</strong> v⃗ = ({vx.toFixed(4)}, {vy.toFixed(4)})
                      </li>
                      <li>
                        <strong>Intrínseca:</strong> v⃗ = {v_mag.toFixed(4)} τ̂ + 0 n̂ (vₜ = {v_mag.toFixed(4)})
                      </li>
                    </ul>
                  </div>

                  {/* VETOR ACELERAÇÃO */}
                  <div style={{ padding: '6px', backgroundColor: '#fff5f5', borderRadius: '4px' }}>
                    <strong style={{ fontSize: '0.85em', color: '#c53030' }}>ACELERAÇÃO (a):</strong>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', fontSize: '0.82em' }}>
                      <li>
                        <strong>Cartesiana:</strong> a⃗ = ({ax.toFixed(4)}, {ay.toFixed(4)})
                      </li>
                      <li>
                        <strong>Intrínseca:</strong> a⃗ = {a_tangencial.toFixed(4)} τ̂ + {a_normal.toFixed(4)} n̂
                      </li>
                    </ul>
                  </div>
                </div>

                {/* TABELA COMPARATIVA DOS 3 INSTANTES EXIGIDOS */}
                <h4 style={{ margin: '10px 0 6px 0', fontSize: '0.88em', color: '#333' }}>
                  Cálculo para 3 Instantes (Item 1.7):
                </h4>
                <table style={{ width: '100%', fontSize: '0.74em', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e2e8f0' }}>
                      <th rowSpan="2" style={thStyle}>t (s)</th>
                      <th colSpan="2" style={{ ...thStyle, backgroundColor: '#dbeafe' }}>Velocidade (v)</th>
                      <th colSpan="2" style={{ ...thStyle, backgroundColor: '#fee2e2' }}>Aceleração (a)</th>
                      <th rowSpan="2" style={thStyle}>ρ</th>
                    </tr>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={thSubStyle}>Cartesiana (v_x, v_y)</th>
                      <th style={thSubStyle}>Intrínseca (v_t)</th>
                      <th style={thSubStyle}>Cartesiana (a_x, a_y)</th>
                      <th style={thSubStyle}>Intrínseca (a_t, a_n)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instantesFixos.map((item) => (
                      <tr key={item.t}>
                        <td style={tdStyle}><strong>{item.t}s</strong></td>
                        <td style={tdStyle}>({item.v_x.toFixed(3)}, {item.v_y.toFixed(3)})</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#0056b3' }}>{item.v_m.toFixed(3)}</td>
                        <td style={tdStyle}>({item.a_x.toFixed(4)}, {item.a_y.toFixed(4)})</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#c53030' }}>({item.a_t.toFixed(4)}, {item.a_n.toFixed(4)})</td>
                        <td style={tdStyle}>{isFinite(item.rho) ? item.rho.toFixed(2) : '∞'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  border: '1px solid #cbd5e1',
  padding: '4px 2px',
  fontWeight: 'bold',
};

const thSubStyle = {
  border: '1px solid #cbd5e1',
  padding: '3px 2px',
  fontSize: '0.9em',
};

const tdStyle = {
  border: '1px solid #e2e8f0',
  padding: '5px 2px',
};