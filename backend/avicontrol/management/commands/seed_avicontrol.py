"""
Seeder de datos de prueba para AVICONTROL.
Ejecutar con:  python manage.py seed_avicontrol
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from avicontrol.models import (
    Usuario, Cliente, Granja, Galpon, Lote, Produccion,
    Producto, Insumo, Pedido, DetallePedido, Venta,
)


class Command(BaseCommand):
    help = "Carga datos de prueba avícolas en AVICONTROL"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=== Iniciando seeders AVICONTROL ==="))

        # ============================================
        # USUARIOS DE PRUEBA (roles del sistema)
        # ============================================
        usuarios_demo = [
            {
                "username": "galpon1",
                "email": "galpon1@avicontrol.com",
                "password": "Galpon12345",
                "rol": "encargado_galpon",
                "nombres": "Juan", "apellidos": "Pérez",
                "telefono": "70011122",
            },
            {
                "username": "inventario1",
                "email": "inventario1@avicontrol.com",
                "password": "Invent12345",
                "rol": "encargado_inventario",
                "nombres": "María", "apellidos": "López",
                "telefono": "70033344",
            },
            {
                "username": "ventas1",
                "email": "ventas1@avicontrol.com",
                "password": "Ventas12345",
                "rol": "encargado_ventas",
                "nombres": "Carlos", "apellidos": "Rojas",
                "telefono": "70055566",
            },
        ]
        for data in usuarios_demo:
            user, created = Usuario.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "rol": data["rol"],
                    "nombres": data["nombres"],
                    "apellidos": data["apellidos"],
                    "telefono": data["telefono"],
                    "activo": True,
                    "is_active": True,
                },
            )
            if created:
                user.set_password(data["password"])
                user.save()
                self.stdout.write(f"  + Usuario: {user.username} ({data['rol']})")

        # ============================================
        # CLIENTES
        # ============================================
        clientes_data = [
            {"nombres": "Distribuidora", "apellidos": "El Huevo Feliz", "dni": "1001", "telefono": "71234567", "email": "contacto@huevofeliz.bo", "direccion": "Av. Busch #123, La Paz"},
            {"nombres": "Mercado", "apellidos": "Central", "dni": "1002", "telefono": "72345678", "email": "central@mercado.bo", "direccion": "Calle Sagárnaga #45, La Paz"},
            {"nombres": "Panadería", "apellidos": "Doña Rosa", "dni": "1003", "telefono": "73456789", "email": "rosa@panaderia.bo", "direccion": "Zona Villa Fátima #78, La Paz"},
            {"nombres": "Restaurante", "apellidos": "La Granja", "dni": "1004", "telefono": "74567890", "email": "lagranja@resto.bo", "direccion": "Av. 6 de Agosto #200, La Paz"},
            {"nombres": "Supermercado", "apellidos": "Andino", "dni": "1005", "telefono": "75678901", "email": "compras@andino.bo", "direccion": "Sopocachi, La Paz"},
        ]
        clientes = []
        for c in clientes_data:
            cli, _ = Cliente.objects.get_or_create(dni=c["dni"], defaults=c)
            clientes.append(cli)
        self.stdout.write(f"  + Clientes: {len(clientes)}")

        # ============================================
        # GRANJA Y GALPONES
        # ============================================
        granja, _ = Granja.objects.get_or_create(
            nombre="Granja Avícola AVICONTROL",
            defaults={"ubicacion": "Carretera a Copacabana Km 15, La Paz", "telefono": "71200000", "activo": True},
        )
        self.stdout.write(f"  + Granja: {granja.nombre}")

        galpones_data = [
            {"codigo": "G-01", "capacidad_aves": 5000},
            {"codigo": "G-02", "capacidad_aves": 4500},
            {"codigo": "G-03", "capacidad_aves": 6000},
        ]
        galpones = []
        for g in galpones_data:
            gal, _ = Galpon.objects.get_or_create(
                granja=granja, codigo=g["codigo"],
                defaults={"capacidad_aves": g["capacidad_aves"], "activo": True},
            )
            galpones.append(gal)
        self.stdout.write(f"  + Galpones: {len(galpones)}")

        # ============================================
        # LOTES
        # ============================================
        lotes_data = [
            {"codigo": "Lote 2025-01", "raza": "Hy-Line Brown", "galpon": galpones[0], "cantidad": 4800, "fecha": date(2025, 1, 15)},
            {"codigo": "Lote 2025-02", "raza": "Lohmann Brown", "galpon": galpones[1], "cantidad": 4200, "fecha": date(2025, 2, 20)},
            {"codigo": "Lote 2025-03", "raza": "Isa Brown", "galpon": galpones[2], "cantidad": 5500, "fecha": date(2025, 3, 10)},
        ]
        lotes = []
        for l in lotes_data:
            lote, _ = Lote.objects.get_or_create(
                codigo=l["codigo"],
                defaults={
                    "galpon": l["galpon"], "raza": l["raza"],
                    "fecha_ingreso": l["fecha"], "cantidad_aves": l["cantidad"],
                    "estado": "en_produccion",
                },
            )
            lotes.append(lote)
        self.stdout.write(f"  + Lotes: {len(lotes)}")

        # ============================================
        # PRODUCCIONES (últimos 7 días)
        # ============================================
        hoy = date.today()
        producciones_creadas = 0
        for lote in lotes:
            for i in range(7):
                fecha = hoy - timedelta(days=i)
                prod, created = Produccion.objects.get_or_create(
                    lote=lote, fecha=fecha,
                    defaults={
                        "huevos_primera": 3500 + i * 10,
                        "huevos_segunda": 500 + i * 5,
                        "huevos_tercera": 300,
                        "huevos_descartados": 50,
                    },
                )
                if created:
                    prod.save()
                    producciones_creadas += 1
        self.stdout.write(f"  + Producciones: {producciones_creadas} registros nuevos")

        # ============================================
        # PRODUCTOS
        # ============================================
        productos_data = [
            {"nombre": "Maple de 30 huevos - Primera", "presentacion": "maple_30", "calidad": "primera", "precio": Decimal("25.00"), "stock": 500, "stock_minimo": 50},
            {"nombre": "Maple de 30 huevos - Segunda", "presentacion": "maple_30", "calidad": "segunda", "precio": Decimal("20.00"), "stock": 300, "stock_minimo": 30},
            {"nombre": "Caja de 360 huevos - Primera", "presentacion": "caja_360", "calidad": "primera", "precio": Decimal("280.00"), "stock": 80, "stock_minimo": 10},
            {"nombre": "Bandeja de 12 huevos - Primera", "presentacion": "bandeja_12", "calidad": "primera", "precio": Decimal("12.00"), "stock": 400, "stock_minimo": 40},
            {"nombre": "Maple de 30 huevos - Tercera", "presentacion": "maple_30", "calidad": "tercera", "precio": Decimal("15.00"), "stock": 200, "stock_minimo": 20},
        ]
        productos = []
        for p in productos_data:
            prod, _ = Producto.objects.get_or_create(
                nombre=p["nombre"],
                defaults={
                    "presentacion": p["presentacion"], "calidad": p["calidad"],
                    "precio_unitario": p["precio"], "stock": p["stock"],
                    "stock_minimo": p["stock_minimo"], "activo": True,
                },
            )
            productos.append(prod)
        self.stdout.write(f"  + Productos: {len(productos)}")

        # ============================================
        # INSUMOS
        # ============================================
        insumos_data = [
            {"nombre": "Alimento balanceado ponedora", "tipo": "alimento", "presentacion": "Saco 40 kg", "stock": Decimal("50"), "stock_minimo": Decimal("10"), "precio": Decimal("180.00"), "vencimiento": hoy + timedelta(days=90)},
            {"nombre": "Vacuna Newcastle", "tipo": "vacuna", "presentacion": "Frasco 100 dosis", "stock": Decimal("20"), "stock_minimo": Decimal("5"), "precio": Decimal("95.00"), "vencimiento": hoy + timedelta(days=20)},
            {"nombre": "Vitamina ADE", "tipo": "vitamina", "presentacion": "Frasco 100 ml", "stock": Decimal("8"), "stock_minimo": Decimal("10"), "precio": Decimal("45.00"), "vencimiento": hoy + timedelta(days=15)},
            {"nombre": "Calcio mineral", "tipo": "medicamento", "presentacion": "Bolsa 25 kg", "stock": Decimal("30"), "stock_minimo": Decimal("5"), "precio": Decimal("60.00"), "vencimiento": hoy + timedelta(days=180)},
        ]
        for i in insumos_data:
            Insumo.objects.get_or_create(
                nombre=i["nombre"],
                defaults={
                    "tipo": i["tipo"], "presentacion": i["presentacion"],
                    "stock": i["stock"], "stock_minimo": i["stock_minimo"],
                    "precio_unitario": i["precio"], "fecha_vencimiento": i["vencimiento"],
                },
            )
        self.stdout.write(f"  + Insumos: {len(insumos_data)}")

        # ============================================
        # PEDIDOS + VENTAS DE EJEMPLO
        # ============================================
        pedidos_creados = 0
        ventas_creadas = 0
        for idx, cliente in enumerate(clientes[:3]):
            fecha = hoy - timedelta(days=idx * 2)
            pedido, creado = Pedido.objects.get_or_create(
                cliente=cliente, fecha_pedido=fecha,
                defaults={"estado": "pendiente"},
            )
            if not creado:
                continue
            producto = productos[idx % len(productos)]
            cantidad = 10 + idx * 5
            DetallePedido.objects.create(
                pedido=pedido, producto=producto,
                cantidad=cantidad, precio_unitario=producto.precio_unitario,
            )
            pedido.recalcular_total()
            pedidos_creados += 1

            if producto.stock >= cantidad:
                producto.stock -= cantidad
                producto.save(update_fields=["stock"])
                pedido.estado = "entregado"
                pedido.save(update_fields=["estado"])
                Venta.objects.create(
                    pedido=pedido, fecha=fecha,
                    monto_total=pedido.total,
                    forma_pago="efectivo",
                )
                ventas_creadas += 1

        self.stdout.write(f"  + Pedidos: {pedidos_creados}, Ventas: {ventas_creadas}")

        self.stdout.write(self.style.SUCCESS("=== Seeders completados con éxito ==="))
        self.stdout.write(self.style.SUCCESS("Credenciales de prueba:"))
        self.stdout.write("  - admin / Admin12345 (superusuario, rol admin)")
        self.stdout.write("  - galpon1 / Galpon12345 (encargado_galpon)")
        self.stdout.write("  - inventario1 / Invent12345 (encargado_inventario)")
        self.stdout.write("  - ventas1 / Ventas12345 (encargado_ventas)")