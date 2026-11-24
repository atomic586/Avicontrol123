from django.test import TestCase
from datetime import date
from decimal import Decimal

from .models import Granja, Usuario
from .gallinaza_models import ProductoGallinaza
from .gallinaza_services import registrar_entrada, registrar_venta, registrar_pago

# Create your tests here.


class GallinazaRulesTests(TestCase):
    def setUp(self):
        self.granja = Granja.objects.create(nombre="Granja Test Abono", codigo="TEST-AB", ubicacion="Test")
        self.usuario = Usuario.objects.create_user(username="abono_test", password="test")
        self.producto = ProductoGallinaza.objects.create(
            granja=self.granja, nombre="Gallinaza fresca", precio_bulto=Decimal("25"),
            precio_kg=Decimal("0.5"), precio_tonelada=Decimal("450"),
            stock_actual_kg=Decimal("100"),
        )

    def test_venta_bultos_convierte_y_descuenta_kilos(self):
        venta = registrar_venta(
            granja=self.granja, fecha=date(2026, 1, 1), metodo_pago="efectivo",
            monto_recibido=Decimal("60"), usuario=self.usuario,
            lineas=[{"producto_id": self.producto.pk, "unidad_vendida": "bulto", "cantidad": 2}],
        )
        detalle = venta.detalles.get()
        self.producto.refresh_from_db()
        self.assertEqual(detalle.cantidad_kg, Decimal("100"))
        self.assertEqual(venta.total, Decimal("50"))
        self.assertEqual(venta.cambio, Decimal("10"))
        self.assertEqual(self.producto.stock_actual_kg, Decimal("0"))

    def test_entrada_incrementa_stock(self):
        registrar_entrada(granja=self.granja, producto_id=self.producto.pk, fecha=date(2026, 1, 1),
                          cantidad_kg=Decimal("15"), origen="Galpón A", usuario=self.usuario)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock_actual_kg, Decimal("115"))

    def test_stock_insuficiente_rechaza_venta(self):
        with self.assertRaisesMessage(ValueError, "Stock insuficiente"):
            registrar_venta(
                granja=self.granja, fecha=date(2026, 1, 1), metodo_pago="credito",
                usuario=self.usuario,
                lineas=[{"producto_id": self.producto.pk, "unidad_vendida": "tonelada", "cantidad": 1}],
            )
        self.assertFalse(self.granja.ventas_gallinaza.exists())

    def test_abonos_actualizan_estado_y_no_superan_saldo(self):
        venta = registrar_venta(
            granja=self.granja, fecha=date(2026, 1, 1), metodo_pago="credito", usuario=self.usuario,
            lineas=[{"producto_id": self.producto.pk, "unidad_vendida": "bulto", "cantidad": 2}],
        )
        registrar_pago(granja=self.granja, venta_id=venta.pk, monto=Decimal("20"), metodo="efectivo", usuario=self.usuario)
        venta.refresh_from_db()
        self.assertEqual(venta.estado, "parcial")
        with self.assertRaisesMessage(ValueError, "supera el saldo"):
            registrar_pago(granja=self.granja, venta_id=venta.pk, monto=Decimal("31"), metodo="transferencia")
        registrar_pago(granja=self.granja, venta_id=venta.pk, monto=Decimal("30"), metodo="transferencia")
        venta.refresh_from_db()
        self.assertEqual(venta.estado, "pagada")
