import React, { useState } from 'react';

// PUBLIC_INTERFACE
function RapidStrikeContainer() {
  /**
   * Main container for RapidStrike: Immersive FPS
   * Contains: 3D view placeholder, minimal HUD, overlay menus
   */
  // Example game state (future: lifted to context or redux)
  const [showWeaponMenu, setShowWeaponMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Dummy player state, typically comes from props or context
  const player = {
    health: 82,
    maxHealth: 100,
    ammo: 19,
    maxAmmo: 30,
    objectives: [
      { text: "Reach the extraction point", complete: false },
      { text: "Eliminate 5 hostiles", complete: true },
    ],
  };

  // Basic inline styles with theme colors
  const colors = {
    primary: "#1a1a1a",
    secondary: "#2d2d2d",
    accent: "#e63946",
    lightBg: "#fafafa",
    hudBg: "rgba(250,250,250,0.93)",
    hudText: "#1a1a1a",
    shadow: "0 4px 32px rgba(44,44,44,0.14)",
  };

  return (
    <div
      className="rapidstrike-container"
      style={{
        width: "100vw", height: "100vh", background: colors.lightBg, position: "relative", fontFamily: "'Inter', sans-serif", overflow: "hidden"
      }}
    >
      {/* 3D Game View Placeholder */}
      <div
        className="game-3d-view"
        style={{
          width: "100vw",
          height: "100vh",
          background: `linear-gradient(120deg, ${colors.primary} 60%, ${colors.secondary} 100%)`,
        }}
      >
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          color: "#fff",
          fontSize: "2.5rem",
          opacity: 0.22,
          letterSpacing: "0.15em",
          pointerEvents: "none",
          userSelect: "none"
        }}>
          {/* Placeholder for embedded 3D Canvas/WebGL */}
          RAPIDSTRIKE – 3D VIEW
        </div>
      </div>

      {/* Minimal HUD */}
      <div
        className="game-hud"
        style={{
          position: "absolute",
          top: 0, left: 0, width: "100%",
          zIndex: 2, pointerEvents: "none",
        }}
      >
        {/* Health bar - top left */}
        <div
          style={{
            margin: 24,
            pointerEvents: "auto",
            display: "inline-block",
            minWidth: 210,
            background: colors.hudBg,
            color: colors.hudText,
            borderRadius: 10,
            boxShadow: colors.shadow,
            padding: "14px 24px",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 2 }}>Health</div>
          <div style={{
            background: "#eee", borderRadius: 7, height: 13, width: 110, marginBottom: 2
          }}>
            <div style={{
              width: `${(player.health / player.maxHealth) * 100}%`,
              background: colors.accent,
              height: "100%",
              borderRadius: 7,
              transition: "width 0.17s",
            }} />
          </div>
          <span style={{ fontWeight: 500, fontSize: "1rem" }}>{player.health} / {player.maxHealth}</span>
        </div>
        {/* Ammo - top left, below health */}
        <div
          style={{
            margin: "10px 0 0 24px",
            pointerEvents: "auto",
            display: "inline-block",
            background: colors.hudBg,
            color: colors.hudText,
            borderRadius: 10,
            boxShadow: colors.shadow,
            padding: "12px 24px",
            minWidth: 110,
            marginLeft: 10
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Ammo</div>
          <span style={{ fontWeight: 600, fontSize: "1.14rem", color: colors.accent }}>
            {player.ammo}
          </span>
          <span style={{ color: colors.hudText }}> / {player.maxAmmo}</span>
        </div>

        {/* Small Top Right Menu button(s) */}
        <div style={{
          position: "absolute", right: 28, top: 30,
          display: "flex", gap: 10, zIndex: 3, pointerEvents: "auto"
        }}>
          <button
            style={hudBtnStyle(colors)}
            onClick={() => setShowWeaponMenu(true)}
            aria-label="Weapon Customization"
          >⚒ Weapon</button>
          <button
            style={hudBtnStyle(colors)}
            onClick={() => setShowLeaderboard(true)}
            aria-label="Leaderboard"
          >🏆 Leaderboard</button>
          <button
            style={hudBtnStyle(colors)}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >⚙️</button>
        </div>
      </div>

      {/* Objectives - bottom left */}
      <div
        className="objectives-list"
        style={{
          position: "absolute", left: 32, bottom: 32, background: colors.hudBg,
          color: colors.hudText, borderRadius: 8, padding: "12px 24px", minWidth: 210,
          pointerEvents: "auto", boxShadow: colors.shadow
        }}
      >
        <div style={{ fontSize: "1.07rem", fontWeight: 700, marginBottom: 4 }}>Objectives</div>
        <ol style={{ margin: 0, padding: "0 0 0 1.2em" }}>
          {player.objectives.map((obj, idx) => (
            <li key={idx} style={{
              color: obj.complete ? "#49a33e" : colors.hudText,
              textDecoration: obj.complete ? "line-through" : "none",
              marginBottom: 1,
              fontWeight: obj.complete ? 400 : 600,
              opacity: obj.complete ? 0.7 : 1
            }}>
              {obj.text}
            </li>
          ))}
        </ol>
      </div>

      {/* Overlay Menus */}
      {showWeaponMenu &&
        <OverlayModal onClose={() => setShowWeaponMenu(false)} title="Weapon Customization">
          <div style={{ padding: 20, color: colors.primary, minWidth: 270 }}>
            <p>Weapon attachments, skins (Placeholder for customization feature)</p>
          </div>
        </OverlayModal>
      }
      {showLeaderboard &&
        <OverlayModal onClose={() => setShowLeaderboard(false)} title="Leaderboard">
          <div style={{ padding: 18, minWidth: 320 }}>
            <p>Leaderboard display goes here (feature placeholder).</p>
          </div>
        </OverlayModal>
      }
      {showSettings &&
        <OverlayModal onClose={() => setShowSettings(false)} title="Settings">
          <div style={{ padding: 16 }}>
            <p>Settings menu (Placeholder).</p>
          </div>
        </OverlayModal>
      )}

      {/* Main menu overlay (shown when not in-game, future implementation) */}
      {/* <MainMenu /> */}
    </div>
  );
}

/**
 * Overlay modal component for menu overlays.
 * @param {Object} props
 * @param {JSX.Element} props.children
 * @param {() => void} props.onClose
 * @param {string} props.title
 */
function OverlayModal({ children, onClose, title }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(26,26,26,0.18)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        minWidth: 300,
        minHeight: 52,
        boxShadow: "0 12px 48px rgba(44,44,44,0.16),0 0 0 1.5px #e63946",
        position: "relative",
        paddingBottom: 12,
        display: "flex",
        flexDirection: "column",
      }}>
        {title &&
          <div style={{
            fontWeight: 700,
            fontSize: "1.19rem",
            color: "#e63946",
            padding: "18px 22px 5px 22px"
          }}>{title}</div>
        }
        <button
          style={{
            position: "absolute", right: 13, top: 10, border: "none", fontSize: "1.1rem",
            background: "transparent", color: "#888", cursor: "pointer", fontWeight: 700, zIndex: 4
          }}
          onClick={onClose}
          aria-label="Close"
        >✕</button>
        <div style={{ marginTop: 7 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Button style
function hudBtnStyle(colors) {
  return {
    background: "#fff",
    color: colors.accent,
    border: `1.5px solid #e63946`,
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "1.06rem",
    boxShadow: colors.shadow,
    padding: "7px 19px",
    marginRight: 2,
    cursor: "pointer",
    transition: "background 0.18s, color 0.18s, border 0.18s",
    outline: "none",
  };
}

export default RapidStrikeContainer;
