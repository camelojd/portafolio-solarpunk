import { describe, it, expect } from "vitest";
import { parseReading, LUX_TO_WM2 } from "../../lib/mqttParse.js";

describe("parseReading", () => {
  it("parsea un payload valido (sin sellar tiempo: eso lo hace el cliente)", () => {
    const r = parseReading('{"temp":24.5,"hum":60,"irr":420}');
    expect(r).toEqual({ temp: 24.5, hum: 60, irr: 420 });
  });

  it("acepta Buffer/Uint8Array (toString)", () => {
    const r = parseReading(Buffer.from('{"temp":21}'));
    expect(r.temp).toBe(21);
  });

  it("deriva irr desde lux cuando no hay irr", () => {
    const r = parseReading('{"temp":20,"lux":12000}');
    expect(r.irr).toBeCloseTo(12000 * LUX_TO_WM2, 6);
  });

  it("descarta el mensaje sin temperatura numerica", () => {
    expect(parseReading('{"hum":60}')).toBeNull();
    expect(parseReading('{"temp":"x"}')).toBeNull();
  });

  it("descarta JSON invalido", () => {
    expect(parseReading("no soy json")).toBeNull();
    expect(parseReading("[1,2,3]")).toBeNull();
  });

  it("ignora un ts del nodo (el tiempo lo sella el cliente)", () => {
    const r = parseReading('{"temp":22,"ts":999}');
    expect(r).toEqual({ temp: 22, hum: undefined, irr: undefined });
  });
});
