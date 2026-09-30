"""Generador de Energía Hidráulica: modelo educativo en condiciones ideales.

Cadena de energía: agua (Ep) -> rueda -> motor DC como generador -> LED.
Los valores son de simulación; no provienen de mediciones del prototipo.
"""
import argparse
from math import inf, sqrt

G = 9.8  # aceleración de la gravedad (m/s²)


class Agua:
    """Masa de agua situada a cierta altura."""

    def __init__(self, masa_kg: float, altura_m: float):
        if not (0 < masa_kg < inf and 0 < altura_m < inf):
            raise ValueError("La masa y la altura deben ser mayores que cero.")
        self.masa_kg = masa_kg
        self.altura_m = altura_m

    def energia_potencial(self) -> float:
        """Ep = m·g·h"""
        return self.masa_kg * G * self.altura_m

    def velocidad_ideal(self) -> float:
        """v = √(2·g·h), sin resistencia del aire."""
        return sqrt(2 * G * self.altura_m)

    def energia_cinetica(self) -> float:
        """Ec = ½·m·v²"""
        return 0.5 * self.masa_kg * self.velocidad_ideal() ** 2


class RuedaAgua:
    """Recibe la energía del agua. 'perdidas' agrupa fricción, calor y
    agua que no golpea bien las paletas (valor entre 0 y 0.95)."""

    def __init__(self, perdidas: float = 0.5):
        if not 0 <= perdidas <= 0.95:
            raise ValueError("Las pérdidas deben estar entre 0 y 0.95.")
        self.perdidas = perdidas

    def energia_mecanica(self, agua: Agua) -> float:
        return agua.energia_cinetica() * (1 - self.perdidas)


class MotorGenerador:
    """Motor DC funcionando como generador (modelo simplificado: las
    pérdidas ya se agrupan en la rueda)."""

    def energia_electrica(self, energia_mecanica: float) -> float:
        return energia_mecanica


class Led:
    """Registra la energía recibida. Cuánta necesita para encender depende
    del LED real; este modelo no lo calcula."""

    def __init__(self):
        self.energia_j = 0.0

    def recibir(self, energia_j: float) -> None:
        self.energia_j = energia_j

    @property
    def recibe_energia(self) -> bool:
        return self.energia_j > 0


class SistemaHidraulico:
    """Controlador: conecta agua, rueda, motor y LED."""

    def __init__(self, agua, rueda, motor=None, led=None):
        self.agua, self.rueda = agua, rueda
        self.motor = motor or MotorGenerador()
        self.led = led or Led()

    def simular(self) -> dict:
        electrica = self.motor.energia_electrica(self.rueda.energia_mecanica(self.agua))
        self.led.recibir(electrica)
        return {
            "energia_potencial_j": round(self.agua.energia_potencial(), 2),
            "velocidad_ms": round(self.agua.velocidad_ideal(), 2),
            "energia_cinetica_j": round(self.agua.energia_cinetica(), 2),
            "energia_util_j": round(electrica, 2),
            "led_recibe_energia": self.led.recibe_energia,
        }


def informe(r: dict) -> str:
    led = "recibe energía" if r["led_recibe_energia"] else "sin energía"
    return (
        f"Energía potencial : {r['energia_potencial_j']:.2f} J\n"
        f"Velocidad ideal   : {r['velocidad_ms']:.2f} m/s\n"
        f"Energía cinética  : {r['energia_cinetica_j']:.2f} J\n"
        f"Energía útil      : {r['energia_util_j']:.2f} J\n"
        f"LED               : {led}"
    )


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Simulación del generador hidráulico")
    p.add_argument("--altura", type=float, default=1, help="altura de caída (m)")
    p.add_argument("--masa", type=float, default=0.5, help="masa de agua (kg)")
    p.add_argument("--perdidas", type=float, default=50, help="pérdidas (%%)")
    a = p.parse_args()
    sistema = SistemaHidraulico(Agua(a.masa, a.altura), RuedaAgua(a.perdidas / 100))
    print(informe(sistema.simular()))
