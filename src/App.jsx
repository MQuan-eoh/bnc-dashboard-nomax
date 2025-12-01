import { useState, useEffect, useRef } from "react";
import "./App.css";
import EnergyChart from "./components/EnergyChart";
import Bar3DChart from "./components/Bar3DChart";
import ThemeSettings from "./components/ThemeSettings";
import eraWidget from "@eohjsc/era-widget";

const MinMaxTable = ({ phase1, phase2, phase3 }) => {
  const format = (val) =>
    val === Infinity || val === -Infinity || val === null
      ? "--"
      : val.toFixed(2);
  return (
    <div className="min-max-container">
      <div className="min-max-grid">
        <div className="mm-header"></div>
        <div className="mm-header">Phase 1</div>
        <div className="mm-header">Phase 2</div>
        <div className="mm-header">Phase 3</div>

        <div className="mm-label">Min</div>
        <div className="mm-value">{format(phase1.min)}</div>
        <div className="mm-value">{format(phase2.min)}</div>
        <div className="mm-value">{format(phase3.min)}</div>

        <div className="mm-label">Max</div>
        <div className="mm-value">{format(phase1.max)}</div>
        <div className="mm-value">{format(phase2.max)}</div>
        <div className="mm-value">{format(phase3.max)}</div>
      </div>
    </div>
  );
};

function App() {
  const [showFullTHD, setShowFullTHD] = useState(false);
  const configIdsRef = useRef([]);

  // Initial Data State
  const [data, setData] = useState({
    summary: {
      uTotal: 0,
      iTotal: 0,
      pMax: 0,
      pMin: 0,
    },
    voltage: {
      u1: 0,
      u2: 0,
      u3: 0,
      unit: "V",
    },
    current: {
      i1: 0,
      i2: 0,
      i3: 0,
      unit: "A",
    },
    power: {
      p1: 0,
      p2: 0,
      p3: 0,
      total: 0,
      unit: "kW",
    },
    maxValues: { pMax: 0, iMax: 0 },
    thd: {
      main: 0,
      details: {
        thdI1: 0,
        thdI2: 0,
        thdI3: 0,
        thdU1N: 0,
        thdU2N: 0,
        thdU3N: 0,
      },
    },
    dailyMinMax: {
      voltage: {
        u1: { min: null, max: null },
        u2: { min: null, max: null },
        u3: { min: null, max: null },
      },
      current: {
        i1: { min: null, max: null },
        i2: { min: null, max: null },
        i3: { min: null, max: null },
      },
      power: {
        p1: { min: null, max: null },
        p2: { min: null, max: null },
        p3: { min: null, max: null },
      },
    },
    extra: {
      activePowerTotal: 0,
      activeEnergyDelivered: 0,
    },
    cosPhi: {
      pf1: 0,
      pf2: 0,
      pf3: 0,
      total: 0,
    },
  });

  // History State for Charts
  const [voltageHistory, setVoltageHistory] = useState([]);
  const [currentHistory, setCurrentHistory] = useState([]);
  const [powerHistory, setPowerHistory] = useState([]);
  const [thdHistory, setThdHistory] = useState([]);

  useEffect(() => {
    eraWidget.init({
      needRealtimeConfigs: true,
      needHistoryConfigs: true,
      needActions: true,
      maxRealtimeConfigsCount: 24,
      maxHistoryConfigsCount: 1,
      maxActionsCount: 2,
      minRealtimeConfigsCount: 0,
      minHistoryConfigsCount: 0,
      minActionsCount: 0,
      onConfiguration: (configuration) => {
        // Store the IDs in order: U1, U2, U3, I1, I2, I3, P1, P2, P3, ...
        configIdsRef.current = configuration.realtime_configs.map((c) => c.id);
        console.log("E-RA Configuration Loaded:", configIdsRef.current);
      },
      onValues: (values) => {
        const ids = configIdsRef.current;
        if (ids.length === 0) return;

        const getValue = (index) =>
          ids[index] && values[ids[index]] ? values[ids[index]].value : 0;

        // Mapping based on user instruction: U1(0), U2(1), U3(2), ...
        const u1 = getValue(0);
        const u2 = getValue(1);
        const u3 = getValue(2);

        const i1 = getValue(3);
        const i2 = getValue(4);
        const i3 = getValue(5);

        const p1 = getValue(6);
        const p2 = getValue(7);
        const p3 = getValue(8);

        // Assuming subsequent values follow a logical order or are calculated
        const pTotal = getValue(9) || p1 + p2 + p3;

        const pMax = getValue(10);
        const pMin = getValue(11);

        // THD values
        const thdI1 = getValue(12);
        const thdI2 = getValue(13);
        const thdI3 = getValue(14);
        const thdU1N = getValue(15);
        const thdU2N = getValue(16);
        const thdU3N = getValue(17);

        const activePowerTotal = getValue(18);
        const activeEnergyDelivered = getValue(19);

        const pf1 = getValue(20);
        const pf2 = getValue(21);
        const pf3 = getValue(22);
        const pfTotal = getValue(23);

        const thdMain = Math.max(thdI1, thdI2, thdI3);

        // Update Data State
        setData((prev) => {
          const updateMinMax = (prevVal, newVal) => {
            if (prevVal.min === null) return { min: newVal, max: newVal };
            return {
              min: Math.min(prevVal.min, newVal),
              max: Math.max(prevVal.max, newVal),
            };
          };

          const newDailyMinMax = {
            voltage: {
              u1: updateMinMax(prev.dailyMinMax.voltage.u1, u1),
              u2: updateMinMax(prev.dailyMinMax.voltage.u2, u2),
              u3: updateMinMax(prev.dailyMinMax.voltage.u3, u3),
            },
            current: {
              i1: updateMinMax(prev.dailyMinMax.current.i1, i1),
              i2: updateMinMax(prev.dailyMinMax.current.i2, i2),
              i3: updateMinMax(prev.dailyMinMax.current.i3, i3),
            },
            power: {
              p1: updateMinMax(prev.dailyMinMax.power.p1, p1),
              p2: updateMinMax(prev.dailyMinMax.power.p2, p2),
              p3: updateMinMax(prev.dailyMinMax.power.p3, p3),
            },
          };

          return {
            summary: {
              uTotal: (u1 + u2 + u3) / 3,
              iTotal: i1 + i2 + i3,
              pMax: pMax,
              pMin: pMin,
            },
            voltage: { u1, u2, u3, unit: "V" },
            current: { i1, i2, i3, unit: "A" },
            power: { p1, p2, p3, total: pTotal, unit: "kW" },
            maxValues: { pMax, iMax: 0 },
            thd: {
              main: thdMain,
              details: { thdI1, thdI2, thdI3, thdU1N, thdU2N, thdU3N },
            },
            dailyMinMax: newDailyMinMax,
            extra: {
              activePowerTotal,
              activeEnergyDelivered,
            },
            cosPhi: {
              pf1,
              pf2,
              pf3,
              total: pfTotal,
            },
          };
        });

        // Update History
        const time = new Date().toLocaleTimeString([], { hour12: false });

        const updateChartData = (prev, v1, v2, v3) => {
          const newData = [
            ...prev,
            { time, value1: v1, value2: v2, value3: v3 },
          ];
          return newData.slice(-20); // Keep last 20 points
        };

        setVoltageHistory((prev) => updateChartData(prev, u1, u2, u3));
        setCurrentHistory((prev) => updateChartData(prev, i1, i2, i3));
        setPowerHistory((prev) => updateChartData(prev, p1, p2, p3));
        setThdHistory((prev) => updateChartData(prev, thdI1, thdI2, thdI3));
      },
    });
  }, []);

  return (
    <div className="dashboard-container">
      {/* Main Data Grid */}
      <div className="grid-container">
        {/* Voltage */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Điện áp (Voltage)</span>
            <span className="icon">⚡</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">U1</span>
              <span className="phase-value">
                {data.voltage.u1.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U2</span>
              <span className="phase-value">
                {data.voltage.u2.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">U3</span>
              <span className="phase-value">
                {data.voltage.u3.toFixed(2)} {data.voltage.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="voltageChart"
            data={voltageHistory}
            lines={[
              { key: "value1", color: "#FFD700", name: "U1" },
              { key: "value2", color: "#FF9100", name: "U2" },
              { key: "value3", color: "#FFFF00", name: "U3" },
            ]}
            unit="V"
            height="150px"
          />
          <MinMaxTable
            phase1={data.dailyMinMax.voltage.u1}
            phase2={data.dailyMinMax.voltage.u2}
            phase3={data.dailyMinMax.voltage.u3}
          />
        </div>

        {/* Current */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Dòng điện (Current)</span>
            <span className="icon">🔌</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">I1</span>
              <span className="phase-value">
                {data.current.i1.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I2</span>
              <span className="phase-value">
                {data.current.i2.toFixed(2)} {data.current.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">I3</span>
              <span className="phase-value">
                {data.current.i3.toFixed(2)} {data.current.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="currentChart"
            data={currentHistory}
            lines={[
              { key: "value1", color: "#00E676", name: "I1" },
              { key: "value2", color: "#00B8D4", name: "I2" },
              { key: "value3", color: "#64DD17", name: "I3" },
            ]}
            unit="A"
            height="150px"
          />
          <MinMaxTable
            phase1={data.dailyMinMax.current.i1}
            phase2={data.dailyMinMax.current.i2}
            phase3={data.dailyMinMax.current.i3}
          />
        </div>

        {/* Power */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Công suất (Power)</span>
            <span className="icon">💡</span>
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">P1</span>
              <span className="phase-value">
                {data.power.p1.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P2</span>
              <span className="phase-value">
                {data.power.p2.toFixed(2)} {data.power.unit}
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">P3</span>
              <span className="phase-value">
                {data.power.p3.toFixed(2)} {data.power.unit}
              </span>
            </div>
          </div>
          <EnergyChart
            id="powerChart"
            data={powerHistory}
            lines={[
              { key: "value1", color: "#FF3D00", name: "P1" },
              { key: "value2", color: "#FF9100", name: "P2" },
              { key: "value3", color: "#FFEA00", name: "P3" },
            ]}
            unit="kW"
            height="150px"
          />
          <MinMaxTable
            phase1={data.dailyMinMax.power.p1}
            phase2={data.dailyMinMax.power.p2}
            phase3={data.dailyMinMax.power.p3}
          />
        </div>

        {/* Cos Phi */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Cos Phi (Power Factor)</span>
            <span className="icon">📈</span>
          </div>

          <div style={{ width: "100%", height: "180px" }}>
            <Bar3DChart
              data={[
                { name: "PF1", value: data.cosPhi.pf1, fill: "#FFD700" },
                { name: "PF2", value: data.cosPhi.pf2, fill: "#FF9100" },
                { name: "PF3", value: data.cosPhi.pf3, fill: "#FFFF00" },
                { name: "Total", value: data.cosPhi.total, fill: "#00E676" },
              ]}
            />
          </div>

          <div className="sub-value">
            <span>Total PF:</span>
            <span>{data.cosPhi.total.toFixed(2)}</span>
          </div>
        </div>

        {/* THD */}
        <div className="glass-panel" style={{ gridColumn: "span 1" }}>
          <div className="panel-header">
            <span className="panel-title">THD (Total Harmonic Distortion)</span>
            <span className="icon">📊</span>
          </div>
          <div>
            <span className="panel-value">{data.thd.main.toFixed(2)}</span>
            <span className="panel-unit">%</span>
          </div>

          <EnergyChart
            id="thdChart"
            data={thdHistory}
            lines={[
              { key: "value1", color: "#2962FF", name: "THD1" },
              { key: "value2", color: "#00B0FF", name: "THD2" },
              { key: "value3", color: "#00E5FF", name: "THD3" },
            ]}
            unit="%"
            height="150px"
          />

          <button
            className="collapse-btn"
            onClick={() => setShowFullTHD(!showFullTHD)}
          >
            {showFullTHD ? "Hide Details" : "Show More Details"}
          </button>

          {showFullTHD && (
            <div className="thd-grid">
              <div className="thd-item">
                <span>THD I1</span>
                <span>{data.thd.details.thdI1.toFixed(2)}%</span>
              </div>
              <div className="thd-item">
                <span>THD I2</span>
                <span>{data.thd.details.thdI2.toFixed(2)}%</span>
              </div>
              <div className="thd-item">
                <span>THD I3</span>
                <span>{data.thd.details.thdI3.toFixed(2)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U1-N</span>
                <span>{data.thd.details.thdU1N.toFixed(2)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U2-N</span>
                <span>{data.thd.details.thdU2N.toFixed(2)}%</span>
              </div>
              <div className="thd-item">
                <span>THD U3-N</span>
                <span>{data.thd.details.thdU3N.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Power & Energy */}
        <div className="glass-panel">
          <div className="panel-header">
            <span className="panel-title">Active Power & Energy</span>
          </div>
          <div style={{ width: "100%", height: "180px" }}>
            <Bar3DChart
              data={[
                {
                  name: "Power",
                  value: data.extra.activePowerTotal,
                  fill: "#2979FF",
                },
                {
                  name: "Energy",
                  value: data.extra.activeEnergyDelivered,
                  fill: "#FFC107",
                },
              ]}
            />
          </div>
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">Active Power Total</span>
              <span className="phase-value">
                {data.extra.activePowerTotal.toFixed(2)} kW
              </span>
            </div>
            <div className="phase-item">
              <span className="phase-label">Active Energy Delivered</span>
              <span className="phase-value">
                {data.extra.activeEnergyDelivered.toFixed(2)} kWh
              </span>
            </div>
          </div>
        </div>
      </div>
      <ThemeSettings />
    </div>
  );
}
export default App;
