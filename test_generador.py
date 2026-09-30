import unittest
from generador import Agua, RuedaAgua, SistemaHidraulico


class PruebasGenerador(unittest.TestCase):
    def test_energia_potencial(self):
        self.assertAlmostEqual(Agua(0.5, 1).energia_potencial(), 4.9)

    def test_cinetica_ideal_igual_a_potencial(self):
        agua = Agua(2, 3)
        self.assertAlmostEqual(agua.energia_cinetica(), agua.energia_potencial())

    def test_perdidas_reducen_energia_util(self):
        r = SistemaHidraulico(Agua(1, 1), RuedaAgua(0.5)).simular()
        self.assertAlmostEqual(r["energia_util_j"], r["energia_potencial_j"] / 2, places=1)

    def test_valores_invalidos(self):
        with self.assertRaises(ValueError):
            Agua(0, 1)
        with self.assertRaises(ValueError):
            RuedaAgua(1.5)


if __name__ == "__main__":
    unittest.main()
