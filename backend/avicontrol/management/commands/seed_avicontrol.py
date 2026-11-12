"""
Seeder de datos de prueba para AVICONTROL multi-granja.
Ejecutar con:  python manage.py seed_avicontrol
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth.hashers import make_password

from avicontrol.models import (
    Granja, Rol, Usuario, Cliente, Galpon, Lote, Produccion,
    Producto, Insumo, GeneracionAbono, Almacen, MovimientoStock,
    Pedido, DetallePedido, Venta, ConfiguracionTienda,
)


class Command(BaseCommand):
    help = "Carga datos de prueba avícolas multi-granja en AVICONTROL"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("=== Iniciando seeders AVICONTROL ==="))

        # ============================================
        # 1. ROLES
        # ============================================
        roles_data = [
            (Rol.SUPERADMIN, "Superadministrador", "Control total de la plataforma"),
            (Rol.ADMIN_GRANJA, "Administrador de Granja", "Administra su granja y usuarios"),
            (Rol.ENCARGADO_VENTAS, "Encargado de Ventas", "Clientes, pedidos, ventas y cobros"),
            (Rol.ENCARGADO_PRODUCCION, "Encargado de Producción", "Aves, producción y sanidad"),
            (Rol.ENCARGADO_ALMACEN, "Encargado de Almacén", "Inventarios, entradas y salidas"),
        ]
        roles = {}
        for codigo, nombre, desc in roles_data:
            rol, _ = Rol.objects.get_or_create(
                codigo=codigo,
                defaults={"nombre": nombre, "descripcion": desc, "activo": True},
            )
            roles[codigo] = rol
        self.stdout.write(f"  + Roles: {len(roles)}")

        # ============================================
        # 2. GRANJA 1 (principal)
        # ============================================
        granja1, _ = Granja.objects.get_or_create(
            codigo="GLP-001",
            defaults={
                "nombre": "Granja Los Pinos",
                "ubicacion": "Carretera a Copacabana Km 15, La Paz",
                "telefono": "71200000",
                "email": "contacto@los-pinos.bo",
                "activo": True,
            },
        )
        self.stdout.write(f"  + Granja 1: {granja1.nombre}")

        # Configuración de tienda para granja 1
        ConfiguracionTienda.objects.get_or_create(
            granja=granja1,
            defaults={
                "hero_titulo": "Huevos frescos para tu hogar. Maplez para tu negocio.",
                "hero_subtitulo": "Elige la calidad y la cantidad que necesitas. Envía tu pedido y coordinamos la entrega.",
                "hero_cta_texto": "Hacer un pedido",
                "telefono_contacto": "+591 712 00000",
            },
        )

        # ============================================
        # 3. GRANJA 2 (segunda, para probar multi-tenant)
        # ============================================
        granja2, _ = Granja.objects.get_or_create(
            codigo="GSA-002",
            defaults={
                "nombre": "Granja Santa Ana",
                "ubicacion": "Valle de Toluca, Cochabamba",
                "telefono": "72300000",
                "email": "contacto@santa-ana.bo",
                "activo": True,
            },
        )
        ConfiguracionTienda.objects.get_or_create(
            granja=granja2,
            defaults={
                "hero_titulo": "Huevos Santa Ana — Calidad de granja",
                "hero_subtitulo": "Producción local, entrega directa.",
                "hero_cta_texto": "Pedir ahora",
                "telefono_contacto": "+591 723 00000",
            },
        )
        self.stdout.write(f"  + Granja 2: {granja2.nombre}")

        # ============================================
        # 4. USUARIOS
        # ============================================
        usuarios_data = [
            # Superadmin (sin granja)
            {
                "username": "superadmin",
                "email": "superadmin@avicontrol.com",
                "password": "Super12345",
                "granja": None,
                "roles": [roles[Rol.SUPERADMIN]],
                "nombres": "Super", "apellidos": "Admin",
                "telefono": "70000000",
            },
            # Admin granja 1
            {
                "username": "admin_glp",
                "email": "admin@los-pinos.bo",
                "password": "Admin12345",
                "granja": granja1,
                "roles": [roles[Rol.ADMIN_GRANJA]],
                "nombres": "Ernesto", "apellidos": "García",
                "telefono": "70011111",
            },
            # Ventas granja 1
            {
                "username": "ventas_glp",
                "email": "ventas@los-pinos.bo",
                "password": "Ventas12345",
                "granja": granja1,
                "roles": [roles[Rol.ENCARGADO_VENTAS]],
                "nombres": "Carlos", "apellidos": "Rojas",
                "telefono": "70022222",
            },
            # Producción granja 1
            {
                "username": "produccion_glp",
                "email": "produccion@los-pinos.bo",
                "password": "Produccion12345",
                "granja": granja1,
                "roles": [roles[Rol.ENCARGADO_PRODUCCION]],
                "nombres": "Juan", "apellidos": "Pérez",
                "telefono": "70033333",
            },
            # Almacén granja 1
            {
                "username": "almacen_glp",
                "email": "almacen@los-pinos.bo",
                "password": "Almacen12345",
                "granja": granja1,
                "roles": [roles[Rol.ENCARGADO_ALMACEN]],
                "nombres": "María", "apellidos": "López",
                "telefono": "70044444",
            },
            # Admin granja 2
            {
                "username": "admin_gsa",
                "email": "admin@santa-ana.bo",
                "password": "Admin12345",
                "granja": granja2,
                "roles": [roles[Rol.ADMIN_GRANJA]],
                "nombres": "Rosa", "apellidos": "Mendoza",
                "telefono": "70055555",
            },
        ]

        for data in usuarios_data:
            user, created = Usuario.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "granja": data["granja"],
                    "nombres": data["nombres"],
                    "apellidos": data["apellidos"],
                    "telefono": data["telefono"],
                    "activo": True,
                    "is_active": True,
                    "is_staff": data["granja"] is None,  # superadmin es staff de Django
                    "is_superuser": data["granja"] is None,
                },
            )
            if created:
                user.set_password(data["password"])
                user.save()
                for rol in data["roles"]:
                    user.roles.add(rol)
        self.stdout.write(f"  + Usuarios: {Usuario.objects.count()}")

        # ============================================
        # 5. CLIENTES (granja 1)
        # ============================================
        clientes_data = [
            {"nombres": "Distribuidora", "apellidos": "El Huevo Feliz", "dni": "1001", "telefono": "71234567", "email": "contacto@huevofeliz.bo", "direccion": "Av. Busch #123"},
            {"nombres": "Mercado", "apellidos": "Central", "dni": "1002", "telefono": "72345678", "email": "central@mercado.bo", "direccion": "Calle Sagárnaga #45"},
            {"nombres": "Panadería", "apellidos": "Doña Rosa", "dni": "1003", "telefono": "73456789", "email": "rosa@panaderia.bo", "direccion": "Villa Fátima #78"},
            {"nombres": "Restaurante", "apellidos": "La Granja", "dni": "1004", "telefono": "74567890", "email": "lagranja@resto.bo", "direccion": "Av. 6 de Agosto #200"},
            {"nombres": "Agroferia", "apellidos": "Andino", "dni": "1005", "telefono": "75678901", "email": "compras@andino.bo", "direccion": "Sopocachi"},
        ]
        clientes = []
        for c in clientes_data:
            cli, _ = Cliente.objects.get_or_create(
                granja=granja1, dni=c["dni"], defaults={**c, "granja": granja1},
            )
            clientes.append(cli)
        self.stdout.write(f"  + Clientes granja 1: {len(clientes)}")

        # Cliente con login (para probar el portal público)
        cliente_login, _ = Cliente.objects.get_or_create(
            granja=granja1, dni="2001",
            defaults={
                "granja": granja1,
                "nombres": "Cliente", "apellidos": "Demo",
                "telefono": "77000000",
                "email": "cliente@demo.com",
                "direccion": "Calle Demo #1",
                "activo": True,
                "puede_loguearse": True,
                "password_hash": make_password("Cliente12345"),
            },
        )

        # ============================================
        # 6. GALPONES Y LOTES (granja 1)
        # ============================================
        galpones_data = [
            {"codigo": "G-01", "capacidad_aves": 5000},
            {"codigo": "G-02", "capacidad_aves": 4500},
            {"codigo": "G-03", "capacidad_aves": 6000},
        ]
        galpones = []
        for g in galpones_data:
            gal, _ = Galpon.objects.get_or_create(
                granja=granja1, codigo=g["codigo"],
                defaults={"capacidad_aves": g["capacidad_aves"], "activo": True},
            )
            galpones.append(gal)

        lotes_data = [
            {"codigo": "Lote 2025-01", "raza": "Hy-Line Brown", "galpon": galpones[0], "cantidad": 4800, "fecha": date(2025, 1, 15)},
            {"codigo": "Lote 2025-02", "raza": "Lohmann Brown", "galpon": galpones[1], "cantidad": 4200, "fecha": date(2025, 2, 20)},
            {"codigo": "Lote 2025-03", "raza": "Isa Brown", "galpon": galpones[2], "cantidad": 5500, "fecha": date(2025, 3, 10)},
        ]
        lotes = []
        for l in lotes_data:
            lote, _ = Lote.objects.get_or_create(
                granja=granja1, codigo=l["codigo"],
                defaults={
                    "galpon": l["galpon"], "raza": l["raza"],
                    "fecha_ingreso": l["fecha"], "cantidad_aves": l["cantidad"],
                    "estado": "en_produccion",
                },
            )
            lotes.append(lote)
        self.stdout.write(f"  + Galpones: {len(galpones)}, Lotes: {len(lotes)}")

        # ============================================
        # 7. PRODUCCIONES (últimos 7 días)
        # ============================================
        hoy = date.today()
        producciones_creadas = 0
        for lote in lotes:
            for i in range(7):
                fecha = hoy - timedelta(days=i)
                prod, created = Produccion.objects.get_or_create(
                    lote=lote, fecha=fecha,
                    defaults={
                        "granja": granja1,
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
        # 8. PRODUCTOS (huevo + abono)
        # ============================================
        productos_data = [
            # Huevos
            {"nombre": "Maple de 30 huevos - Primera", "tipo": "huevo", "presentacion": "maple_30", "calidad": "primera", "unidad_medida": "maple", "precio": Decimal("27.00"), "stock": Decimal("500"), "stock_minimo": Decimal("50")},
            {"nombre": "Maple de 30 huevos - Segunda", "tipo": "huevo", "presentacion": "maple_30", "calidad": "segunda", "unidad_medida": "maple", "precio": Decimal("25.00"), "stock": Decimal("300"), "stock_minimo": Decimal("30")},
            {"nombre": "Caja de 360 huevos - Primera", "tipo": "huevo", "presentacion": "caja_360", "calidad": "primera", "unidad_medida": "caja", "precio": Decimal("280.00"), "stock": Decimal("80"), "stock_minimo": Decimal("10")},
            {"nombre": "Bandeja de 12 huevos - Primera", "tipo": "huevo", "presentacion": "bandeja_12", "calidad": "primera", "unidad_medida": "unidad", "precio": Decimal("12.00"), "stock": Decimal("400"), "stock_minimo": Decimal("40")},
            {"nombre": "Maple de 30 huevos - Tercera", "tipo": "huevo", "presentacion": "maple_30", "calidad": "tercera", "unidad_medida": "maple", "precio": Decimal("23.00"), "stock": Decimal("200"), "stock_minimo": Decimal("20")},
            # Abono (gallinaza)
            {"nombre": "Gallinaza fresca - Saco 40 kg", "tipo": "abono", "presentacion": "saco_kg", "calidad": "fresco", "unidad_medida": "saco", "precio": Decimal("25.00"), "stock": Decimal("100"), "stock_minimo": Decimal("10")},
            {"nombre": "Gallinaza compostada - Saco 25 kg", "tipo": "abono", "presentacion": "saco_kg", "calidad": "compostado", "unidad_medida": "saco", "precio": Decimal("35.00"), "stock": Decimal("50"), "stock_minimo": Decimal("5")},
            {"nombre": "Gallinaza a granel", "tipo": "abono", "presentacion": "granel", "calidad": "acondicionado", "unidad_medida": "tonelada", "precio": Decimal("500.00"), "stock": Decimal("10"), "stock_minimo": Decimal("1")},
        ]
        productos = []
        for p in productos_data:
            prod, _ = Producto.objects.get_or_create(
                granja=granja1, nombre=p["nombre"],
                defaults={
                    "granja": granja1, "nombre": p["nombre"], "tipo": p["tipo"],
                    "presentacion": p["presentacion"], "calidad": p["calidad"],
                    "unidad_medida": p["unidad_medida"], "precio_unitario": p["precio"],
                    "stock": p["stock"], "stock_minimo": p["stock_minimo"],
                    "activo": True,
                },
            )
            productos.append(prod)
        self.stdout.write(f"  + Productos: {len(productos)}")

        # ============================================
        # 9. INSUMOS
        # ============================================
        insumos_data = [
            {"nombre": "Alimento balanceado ponedora", "tipo": "alimento", "presentacion": "Saco 40 kg", "stock": Decimal("50"), "stock_minimo": Decimal("10"), "precio": Decimal("180.00"), "vencimiento": hoy + timedelta(days=90)},
            {"nombre": "Vacuna Newcastle", "tipo": "vacuna", "presentacion": "Frasco 100 dosis", "stock": Decimal("20"), "stock_minimo": Decimal("5"), "precio": Decimal("95.00"), "vencimiento": hoy + timedelta(days=20)},
            {"nombre": "Vitamina ADE", "tipo": "vitamina", "presentacion": "Frasco 100 ml", "stock": Decimal("8"), "stock_minimo": Decimal("10"), "precio": Decimal("45.00"), "vencimiento": hoy + timedelta(days=15)},
            {"nombre": "Calcio mineral", "tipo": "medicamento", "presentacion": "Bolsa 25 kg", "stock": Decimal("30"), "stock_minimo": Decimal("5"), "precio": Decimal("60.00"), "vencimiento": hoy + timedelta(days=180)},
        ]
        for i in insumos_data:
            Insumo.objects.get_or_create(
                granja=granja1, nombre=i["nombre"],
                defaults={
                    "granja": granja1, "nombre": i["nombre"], "tipo": i["tipo"],
                    "presentacion": i["presentacion"], "stock": i["stock"],
                    "stock_minimo": i["stock_minimo"], "precio_unitario": i["precio"],
                    "fecha_vencimiento": i["vencimiento"],
                },
            )
        self.stdout.write(f"  + Insumos: {len(insumos_data)}")

        # ============================================
        # 10. GENERACIÓN DE ABONO (últimos 5 días)
        # ============================================
        abonos_creados = 0
        for i in range(5):
            fecha = hoy - timedelta(days=i)
            for galpon in galpones[:2]:  # solo G-01 y G-02
                _, created = GeneracionAbono.objects.get_or_create(
                    granja=granja1, galpon=galpon, fecha=fecha,
                    defaults={
                        "granja": granja1,
                        "galpon": galpon,
                        "fecha": fecha,
                        "cantidad_kg": Decimal("150.00") + Decimal(str(i * 10)),
                        "estado": "fresco" if i < 2 else "seco",
                        "responsable": "Juan Pérez",
                    },
                )
                if created:
                    abonos_creados += 1
        self.stdout.write(f"  + Generaciones de abono: {abonos_creados}")

        # ============================================
        # 11. ALMACENES
        # ============================================
        almacen1, _ = Almacen.objects.get_or_create(
            granja=granja1, nombre="Almacén Principal",
            defaults={"granja": granja1, "ubicacion": "Edificio A, planta baja"},
        )
        Almacen.objects.get_or_create(
            granja=granja1, nombre="Almacén de Abono",
            defaults={"granja": granja1, "ubicacion": "Patio trasero"},
        )
        self.stdout.write(f"  + Almacenes: {Almacen.objects.filter(granja=granja1).count()}")

        # ============================================
        # 12. PEDIDOS + VENTAS DE EJEMPLO
        # ============================================
        pedidos_creados = 0
        ventas_creadas = 0
        for idx, cliente in enumerate(clientes[:3]):
            fecha = hoy - timedelta(days=idx * 2)
            pedido, creado = Pedido.objects.get_or_create(
                granja=granja1, cliente=cliente, fecha_pedido=fecha,
                defaults={"granja": granja1, "estado": "pendiente"},
            )
            if not creado:
                continue
            producto = productos[idx % len(productos)]
            cantidad = Decimal("10") + Decimal(str(idx * 5))
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
                    granja=granja1, pedido=pedido, fecha=fecha,
                    monto_total=pedido.total, forma_pago="efectivo",
                )
                ventas_creadas += 1

        self.stdout.write(f"  + Pedidos: {pedidos_creados}, Ventas: {ventas_creadas}")

        # ============================================
        # RESUMEN FINAL
        # ============================================
        self.stdout.write(self.style.SUCCESS("=== Seeders completados con éxito ==="))
        self.stdout.write(self.style.SUCCESS("\nCredenciales de prueba:"))
        self.stdout.write("  STAFF (login en /admin-login):")
        self.stdout.write("    - superadmin / Super12345 (Superadmin — ve todas las granjas)")
        self.stdout.write("    - admin_glp / Admin12345 (Admin Granja Los Pinos)")
        self.stdout.write("    - ventas_glp / Ventas12345 (Encargado Ventas GLP)")
        self.stdout.write("    - produccion_glp / Produccion12345 (Encargado Producción GLP)")
        self.stdout.write("    - almacen_glp / Almacen12345 (Encargado Almacén GLP)")
        self.stdout.write("    - admin_gsa / Admin12345 (Admin Granja Santa Ana)")
        self.stdout.write("\n  CLIENTE (login en /login):")
        self.stdout.write("    - cliente@demo.com / Cliente12345 (Cliente demo granja 1)")