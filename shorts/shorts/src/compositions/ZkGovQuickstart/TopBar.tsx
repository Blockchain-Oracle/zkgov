import { theme } from "../../theme";

export const TopBar: React.FC<{ active: string }> = ({ active }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "36px 40px",
        borderBottom: `1px solid ${theme.colors.border}`,
        fontFamily: theme.fonts.mono,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentStrong})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.fonts.sans,
            fontWeight: 800,
            fontSize: 30,
            color: "#0a0a0a",
          }}
        >
          Z
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: 32,
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: "-0.01em",
          }}
        >
          ZKGov
        </div>
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: theme.letterSpacing.nav,
          padding: "10px 16px",
          borderRadius: 6,
          color: theme.colors.text,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${theme.colors.border}`,
          marginLeft: 8,
        }}
      >
        {active}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 16px",
          borderRadius: 8,
          border: `1px solid ${theme.colors.border}`,
          background: "rgba(255, 255, 255, 0.03)",
          fontSize: 18,
          color: theme.colors.text,
          letterSpacing: "0.02em",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: theme.colors.success,
            boxShadow: `0 0 12px ${theme.colors.success}`,
          }}
        />
        0X7D71...F49C
      </div>
    </div>
  );
};
