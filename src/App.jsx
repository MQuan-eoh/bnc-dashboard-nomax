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

  const renderValue = (val, time) => (
    <div className="mm-value tooltip-container">
      {format(val)}
      {time && (
        <div className="tooltip-content">
          <div className="tooltip-icon">🕒</div>
          <div className="tooltip-info">
            <span className="tooltip-label">Recorded at</span>
            <span className="tooltip-time">{time}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-max-container">
      <div className="min-max-grid">
        <div className="mm-header"></div>
        <div className="mm-header">Phase 1</div>
        <div className="mm-header">Phase 2</div>
        <div className="mm-header">Phase 3</div>

        <div className="mm-label">Min</div>
        {renderValue(phase1.min, phase1.minTime)}
        {renderValue(phase2.min, phase2.minTime)}
        {renderValue(phase3.min, phase3.minTime)}

        <div className="mm-label">Max</div>
        {renderValue(phase1.max, phase1.maxTime)}
        {renderValue(phase2.max, phase2.maxTime)}
        {renderValue(phase3.max, phase3.maxTime)}
      </div>
    </div>
  );
};

const Header = ({ activePower, activeEnergy }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-header">
      <div className="header-item">
        <span className="header-label">Current Time</span>
        <span className="header-value">
          {currentTime.toLocaleString("vi-VN")}
        </span>
      </div>
      <div className="header-item">
        <span className="header-label">Active Power Total</span>
        <span className="header-value">{activePower.toFixed(2)} kW</span>
      </div>
      <div className="header-item">
        <span className="header-label">Active Energy Delivered</span>
        <span className="header-value">{activeEnergy.toFixed(2)} kWh</span>
      </div>
    </div>
  );
};

function App() {
  const [showFullTHD, setShowFullTHD] = useState(false);
  const configIdsRef = useRef([]);
  const lastPMinUpdateRef = useRef(0);
  const currentPMinRef = useRef(Infinity);
  const lastPMaxUpdateRef = useRef(0);
  const currentPMaxRef = useRef(-Infinity);

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
      cosPhi: {
        pf1: { min: null, max: null },
        pf2: { min: null, max: null },
        pf3: { min: null, max: null },
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
  const [cosPhiHistory, setCosPhiHistory] = useState([]);
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
      mobileHeight: 1000,
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
        const pTotal = p1 + p2 + p3;

        const now = Date.now();

        // Update PMax
        if (now - lastPMaxUpdateRef.current >= 5000) {
          const currentBatchMax = Math.max(p1, p2, p3);
          if (
            currentPMaxRef.current === -Infinity ||
            currentBatchMax > currentPMaxRef.current
          ) {
            currentPMaxRef.current = currentBatchMax;
          }
          lastPMaxUpdateRef.current = now;
        }
        const pMax =
          currentPMaxRef.current === -Infinity ? 0 : currentPMaxRef.current;

        // Update PMin
        if (now - lastPMinUpdateRef.current >= 5000) {
          const currentBatchMin = Math.min(p1, p2, p3);
          if (
            currentPMinRef.current === Infinity ||
            currentBatchMin < currentPMinRef.current
          ) {
            currentPMinRef.current = currentBatchMin;
          }
          lastPMinUpdateRef.current = now;
        }
        const pMin =
          currentPMinRef.current === Infinity ? 0 : currentPMinRef.current;

        // THD values
        const thdI1 = getValue(9);
        const thdI2 = getValue(10);
        const thdI3 = getValue(11);
        const thdU1N = getValue(12);
        const thdU2N = getValue(13);
        const thdU3N = getValue(14);

        const activePowerTotal = getValue(15);
        const activeEnergyDelivered = getValue(16);

        const pf1 = getValue(17);
        const pf2 = getValue(18);
        const pf3 = getValue(19);
        const pfTotal = getValue(20);

        const thdMain = Math.max(thdI1, thdI2, thdI3);
        const time = new Date().toLocaleTimeString([], { hour12: false });

        // Update Data State
        setData((prev) => {
          const updateMinMax = (prevVal, newVal, currentTime) => {
            const currentMin = prevVal.min;
            const currentMax = prevVal.max;
            const currentMinTime = prevVal.minTime || null;
            const currentMaxTime = prevVal.maxTime || null;

            let nextMin = currentMin;
            let nextMinTime = currentMinTime;
            let nextMax = currentMax;
            let nextMaxTime = currentMaxTime;

            if (currentMin === null || newVal < currentMin) {
              nextMin = newVal;
              nextMinTime = currentTime;
            }

            if (currentMax === null || newVal > currentMax) {
              nextMax = newVal;
              nextMaxTime = currentTime;
            }

            return {
              min: nextMin,
              minTime: nextMinTime,
              max: nextMax,
              maxTime: nextMaxTime,
            };
          };

          const newDailyMinMax = {
            voltage: {
              u1: updateMinMax(prev.dailyMinMax.voltage.u1, u1, time),
              u2: updateMinMax(prev.dailyMinMax.voltage.u2, u2, time),
              u3: updateMinMax(prev.dailyMinMax.voltage.u3, u3, time),
            },
            current: {
              i1: updateMinMax(prev.dailyMinMax.current.i1, i1, time),
              i2: updateMinMax(prev.dailyMinMax.current.i2, i2, time),
              i3: updateMinMax(prev.dailyMinMax.current.i3, i3, time),
            },
            power: {
              p1: updateMinMax(prev.dailyMinMax.power.p1, p1, time),
              p2: updateMinMax(prev.dailyMinMax.power.p2, p2, time),
              p3: updateMinMax(prev.dailyMinMax.power.p3, p3, time),
            },
            cosPhi: {
              pf1: updateMinMax(
                prev.dailyMinMax.cosPhi?.pf1 || { min: null, max: null },
                pf1,
                time
              ),
              pf2: updateMinMax(
                prev.dailyMinMax.cosPhi?.pf2 || { min: null, max: null },
                pf2,
                time
              ),
              pf3: updateMinMax(
                prev.dailyMinMax.cosPhi?.pf3 || { min: null, max: null },
                pf3,
                time
              ),
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
        setCosPhiHistory((prev) => updateChartData(prev, pf1, pf2, pf3));
        setThdHistory((prev) => updateChartData(prev, thdI1, thdI2, thdI3));
      },
    });
  }, []);

  return (
    <div className="dashboard-container">
      <Header
        activePower={data.extra.activePowerTotal}
        activeEnergy={data.extra.activeEnergyDelivered}
      />
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
          <div className="phase-grid">
            <div className="phase-item">
              <span className="phase-label">PF1</span>
              <span className="phase-value">{data.cosPhi.pf1.toFixed(2)}</span>
            </div>
            <div className="phase-item">
              <span className="phase-label">PF2</span>
              <span className="phase-value">{data.cosPhi.pf2.toFixed(2)}</span>
            </div>
            <div className="phase-item">
              <span className="phase-label">PF3</span>
              <span className="phase-value">{data.cosPhi.pf3.toFixed(2)}</span>
            </div>
          </div>
          <EnergyChart
            id="cosPhiChart"
            data={cosPhiHistory}
            lines={[
              { key: "value1", color: "#FFD700", name: "PF1" },
              { key: "value2", color: "#FF9100", name: "PF2" },
              { key: "value3", color: "#FFFF00", name: "PF3" },
            ]}
            unit=""
            height="150px"
          />
          <MinMaxTable
            phase1={data.dailyMinMax.cosPhi?.pf1 || { min: 0, max: 0 }}
            phase2={data.dailyMinMax.cosPhi?.pf2 || { min: 0, max: 0 }}
            phase3={data.dailyMinMax.cosPhi?.pf3 || { min: 0, max: 0 }}
          />
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
      </div>
      <ThemeSettings />
    </div>
  );
}
export default App;
