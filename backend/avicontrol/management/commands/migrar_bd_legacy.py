"""
Migra una base de datos AVICONTROL v1.0 (esquema antiguo) al esquema
multi-granja actual, conservando todos los datos y los IDs existentes.

Uso:
    python manage.py migrar_bd_legacy

El comando:
  1. Detecta si la BD tiene el esquema antiguo.
  2. Guarda un respaldo JSON de los datos en respaldo_db/.
  3. Recrea el esquema y aplica las migraciones actuales.
  4. Recarga los datos mapeando los campos antiguos a los nuevos.
  5. Reajusta las secuencias de IDs.
"""

import json
import re
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from avicontrol.models import (
    Almacen, Auditoria, Cliente, ConfiguracionTienda, DetallePedido,
    Galpon, Granja, Insumo, Lote, Pedido, Produccion, Producto,
    Rol, Usuario, Venta,
)


ROLES = [
    ("superadmin", "Superadministrador", "Acceso total al sistema."),
    ("admin_granja", "Administrador de Granja", "Administra una granja."),
    ("encargado_ventas", "Encargado de Ventas", "Gestiona pedidos y ventas."),
    ("encargado_produccion", "Encargado de Producción", "Gestiona lotes y producción."),
    ("encargado_almacen", "Encargado de Almacén", "Gestiona insumos y stock."),
]

MAPA_ROLES = {
    "superadmin": "superadmin",
    "admin": "admin_granja",
    "admin_granja": "admin_granja",
    "encargado_galpon": "encargado_produccion",
    "encargado_produccion": "encargado_produccion",
    "encargado_inventario": "encargado_almacen",
    "encargado_almacen": "encargado_almacen",
    "encargado_ventas": "encargado_ventas",
    "ventas": "encargado_ventas",
    "cliente": None,
}

MAPA_PRESENTACION = {
    "maple": "maple_30",
    "maple_30": "maple_30",
    "caja": "caja_360",
    "caja_360": "caja_360",
    "bandeja": "bandeja_12",
    "bandeja_12": "bandeja_12",
    "saco": "saco_kg",
    "saco_kg": "saco_kg",
    "tonelada": "tonelada",
    "granel": "granel",
    "otra": "otra",
}

MAPA_CALIDAD = {
    "primera": "primera",
    "segunda": "segunda",
    "tercera": "tercera",
    "mixta": "mixta",
    "fresco": "fresco",
    "acondicionado": "acondicionado",
    "compostado": "compostado",
    "otra": "otra",
}

MAPA_UNIDAD = {
    "maple": "maple",
    "maple_30": "maple",
    "caja": "caja",
    "caja_360": "caja",
    "bandeja": "unidad",
    "bandeja_12": "unidad",
    "saco": "saco",
    "saco_kg": "saco",
    "tonelada": "tonelada",
    "granel": "unidad",
    "otra": "unidad",
}

MAPA_ACCION = {
    "crear": "crear",
    "editar": "editar",
    "eliminar": "eliminar",
    "login": "login",
}


def _fecha(valor):
    if isinstance(valor, datetime):
        return valor.date()
    return valor


def _accion_legacy(valor):
    texto = (valor or "").upper()
    for clave in ("CREAR", "ACTUALIZAR", "EDITAR", "ELIMINAR", "LOGIN", "TOKEN"):
        if clave in texto:
            if clave == "ACTUALIZAR":
                return "editar"
            if clave == "TOKEN":
                return "login"
            return clave.lower()
    return "editar"


def _detalle_json(valor):
    if valor is None:
        return {}
    if isinstance(valor, (dict, list)):
        return valor
    if isinstance(valor, str):
        try:
            return json.loads(valor) if valor.strip() else {}
        except (ValueError, TypeError):
            return {"texto": valor}
    return {"valor": str(valor)}


class Command(BaseCommand):
    help = "Migra la BD v1.0 al esquema multi-granja actual conservando los datos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--sin-respaldo",
            action="store_true",
            help="No escribir el respaldo JSON (no recomendado).",
        )

    def handle(self, *args, **options):
        tablas = set(connection.introspection.table_names())
        if "usuario" not in tablas or "granja" not in tablas:
            self.stdout.write(
                "No se encontró una base legacy de AVICONTROL. Nada que migrar."
            )
            return

        columnas = self._columnas("usuario")
        if {"first_name", "is_active", "date_joined", "granja_id"} <= columnas:
            self.stdout.write(
                "La base de datos ya tiene el esquema nuevo. Nada que migrar."
            )
            return

        self.stdout.write("Detectada base de datos legacy. Extrayendo datos...")
        datos = self._extraer(tablas)

        if not options["sin_respaldo"]:
            self._guardar_respaldo(datos)

        self.stdout.write("Recreando esquema y aplicando migraciones...")
        self._recrear_esquema()

        self.stdout.write("Recargando datos...")
        self._recargar(datos)

        self._reajustar_secuencias()
        self._verificar(datos)
        self.stdout.write(
            self.style.SUCCESS(
                "Migración completada. Datos y IDs conservados correctamente."
            )
        )

    # ------------------------------------------------------------------
    # Introspección y extracción
    # ------------------------------------------------------------------
    def _columnas(self, tabla):
        with connection.cursor() as cursor:
            return {
                campo.name
                for campo in connection.introspection.get_table_description(cursor, tabla)
            }

    def _filas(self, sql):
        with connection.cursor() as cursor:
            cursor.execute(sql)
            columnas = [c[0] for c in cursor.description]
            return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]

    def _extraer(self, tablas):
        datos = {}
        consultas = {
            "granja": "SELECT id, nombre, ubicacion, telefono, activo, creado_en FROM granja ORDER BY id",
            "usuario": (
                "SELECT id, password, last_login, is_superuser, username, email, "
                "rol, nombres, apellidos, telefono, activo, is_staff, creado_en "
                "FROM usuario ORDER BY id"
            ),
            "cliente": (
                "SELECT id, nombres, apellidos, dni, telefono, email, direccion, "
                "creado_en, usuario_id FROM cliente ORDER BY id"
            ),
            "galpon": (
                "SELECT id, codigo, capacidad_aves, activo, creado_en, granja_id "
                "FROM galpon ORDER BY id"
            ),
            "lote": (
                "SELECT id, codigo, raza, fecha_ingreso, cantidad_aves, estado, "
                "creado_en, galpon_id FROM lote ORDER BY id"
            ),
            "produccion": (
                "SELECT id, fecha, huevos_primera, huevos_segunda, huevos_tercera, "
                "huevos_descartados, total, creado_en, lote_id "
                "FROM produccion ORDER BY id"
            ),
            "producto": (
                "SELECT id, nombre, presentacion, categoria, precio_unitario, stock, "
                "stock_minimo, activo, creado_en FROM producto ORDER BY id"
            ),
            "insumo": (
                "SELECT id, nombre, tipo, presentacion, stock, stock_minimo, "
                "precio_unitario, fecha_vencimiento, creado_en FROM insumo ORDER BY id"
            ),
            "pedido": (
                "SELECT id, fecha_pedido, estado, total, creado_en, cliente_id "
                "FROM pedido ORDER BY id"
            ),
            "detalle_pedido": (
                "SELECT id, cantidad, precio_unitario, subtotal, pedido_id, producto_id "
                "FROM detalle_pedido ORDER BY id"
            ),
            "venta": (
                "SELECT id, fecha, monto_total, forma_pago, creado_en, pedido_id "
                "FROM venta ORDER BY id"
            ),
            "auditoria": (
                "SELECT id, usuario_email, accion, entidad, entidad_id, detalle, ip, "
                "creado_en, usuario_id FROM auditoria ORDER BY id"
            ),
            "configuracion_tienda": (
                "SELECT id, hero_titulo, hero_subtitulo, hero_cta_texto, "
                "hero_imagen_url, nombre_granja, telefono_contacto, actualizado_en "
                "FROM configuracion_tienda ORDER BY id"
            ),
        }
        for tabla, sql in consultas.items():
            datos[tabla] = self._filas(sql) if tabla in tablas else []
            self.stdout.write(f"  {tabla}: {len(datos[tabla])} filas")
        return datos

    def _guardar_respaldo(self, datos):
        carpeta = Path(settings.BASE_DIR) / "respaldo_db"
        carpeta.mkdir(parents=True, exist_ok=True)
        ruta = carpeta / f"datos_legacy_{timezone.now():%Y%m%d_%H%M%S}.json"
        with ruta.open("w", encoding="utf-8") as archivo:
            json.dump(datos, archivo, ensure_ascii=False, indent=2, default=str)
        self.stdout.write(f"Respaldo JSON guardado en: {ruta}")

    # ------------------------------------------------------------------
    # Esquema nuevo
    # ------------------------------------------------------------------
    def _recrear_esquema(self):
        connection.close()
        with connection.cursor() as cursor:
            cursor.execute("DROP SCHEMA public CASCADE")
            cursor.execute("CREATE SCHEMA public")
        connection.close()
        call_command("migrate", interactive=False, verbosity=1)

    # ------------------------------------------------------------------
    # Recarga
    # ------------------------------------------------------------------
    def _recargar(self, datos):
        granjas = {}
        for fila in datos["granja"]:
            base = "".join(
                palabra[0] for palabra in re.findall(r"[A-Za-z0-9]+", fila["nombre"] or "")
            ).upper()[:8] or "GRANJA"
            granja = Granja.objects.create(
                id=fila["id"],
                nombre=fila["nombre"],
                codigo=f"{base}-{fila['id']}",
                ubicacion=fila["ubicacion"] or "",
                telefono=fila["telefono"] or "",
                email="",
                activo=bool(fila["activo"]),
            )
            Granja.objects.filter(pk=granja.pk).update(creado_en=fila["creado_en"])
            granjas[granja.pk] = granja

        granja_base = granjas[min(granjas)] if granjas else None
        if granja_base is None:
            raise ValueError("La base legacy no tiene granjas; no se puede continuar.")

        roles = {}
        for codigo, nombre, descripcion in ROLES:
            rol, _ = Rol.objects.get_or_create(
                codigo=codigo,
                defaults={"nombre": nombre, "descripcion": descripcion, "activo": True},
            )
            roles[codigo] = rol

        contrasenas = {}
        for fila in datos["usuario"]:
            usuario = Usuario.objects.create(
                id=fila["id"],
                username=fila["username"],
                email=fila["email"] or "",
                password=fila["password"],
                first_name=fila.get("nombres") or "",
                last_name=fila.get("apellidos") or "",
                is_superuser=bool(fila["is_superuser"]),
                is_staff=bool(fila["is_staff"]),
                is_active=bool(fila["activo"]),
                nombres=fila.get("nombres") or "",
                apellidos=fila.get("apellidos") or "",
                telefono=fila.get("telefono") or "",
                activo=bool(fila["activo"]),
                last_login=fila.get("last_login"),
                date_joined=fila.get("creado_en") or timezone.now(),
            )
            Usuario.objects.filter(pk=usuario.pk).update(creado_en=fila["creado_en"])
            codigo_rol = MAPA_ROLES.get((fila.get("rol") or "").lower())
            if codigo_rol:
                usuario.roles.add(roles[codigo_rol])
            contrasenas[usuario.pk] = fila["password"]

        for fila in datos["cliente"]:
            password_hash = contrasenas.get(fila.get("usuario_id"))
            cliente = Cliente.objects.create(
                id=fila["id"],
                granja=granja_base,
                nombres=fila["nombres"],
                apellidos=fila["apellidos"],
                dni=fila["dni"],
                telefono=fila["telefono"] or "",
                email=fila["email"] or None,
                direccion=fila["direccion"] or "",
                password_hash=password_hash,
                puede_loguearse=bool(password_hash),
                activo=True,
            )
            Cliente.objects.filter(pk=cliente.pk).update(creado_en=fila["creado_en"])

        galpones = {}
        for fila in datos["galpon"]:
            galpon = Galpon.objects.create(
                id=fila["id"],
                granja=granjas[fila["granja_id"]],
                codigo=fila["codigo"],
                capacidad_aves=fila["capacidad_aves"],
                activo=bool(fila["activo"]),
            )
            Galpon.objects.filter(pk=galpon.pk).update(creado_en=fila["creado_en"])
            galpones[galpon.pk] = galpon

        lotes = {}
        for fila in datos["lote"]:
            galpon = galpones[fila["galpon_id"]]
            lote = Lote.objects.create(
                id=fila["id"],
                granja=galpon.granja,
                galpon=galpon,
                codigo=fila["codigo"],
                raza=fila["raza"],
                fecha_ingreso=_fecha(fila["fecha_ingreso"]),
                cantidad_aves=fila["cantidad_aves"],
                estado=fila["estado"],
            )
            Lote.objects.filter(pk=lote.pk).update(creado_en=fila["creado_en"])
            lotes[lote.pk] = lote

        for fila in datos["produccion"]:
            lote = lotes[fila["lote_id"]]
            produccion = Produccion.objects.create(
                id=fila["id"],
                granja=lote.granja,
                lote=lote,
                fecha=_fecha(fila["fecha"]),
                huevos_primera=fila["huevos_primera"],
                huevos_segunda=fila["huevos_segunda"],
                huevos_tercera=fila["huevos_tercera"],
                huevos_descartados=fila["huevos_descartados"],
            )
            Produccion.objects.filter(pk=produccion.pk).update(creado_en=fila["creado_en"])

        for fila in datos["producto"]:
            presentacion = fila["presentacion"]
            producto = Producto.objects.create(
                id=fila["id"],
                granja=granja_base,
                nombre=fila["nombre"],
                tipo="huevo",
                presentacion=MAPA_PRESENTACION.get(presentacion, "otra"),
                calidad=MAPA_CALIDAD.get(fila["categoria"], "otra"),
                unidad_medida=MAPA_UNIDAD.get(presentacion, "unidad"),
                precio_unitario=fila["precio_unitario"],
                stock=fila["stock"],
                stock_minimo=fila["stock_minimo"],
                activo=bool(fila["activo"]),
            )
            Producto.objects.filter(pk=producto.pk).update(creado_en=fila["creado_en"])

        for fila in datos["insumo"]:
            insumo = Insumo.objects.create(
                id=fila["id"],
                granja=granja_base,
                nombre=fila["nombre"],
                tipo=fila["tipo"],
                presentacion=fila["presentacion"] or "",
                stock=fila["stock"],
                stock_minimo=fila["stock_minimo"],
                precio_unitario=fila["precio_unitario"],
                fecha_vencimiento=_fecha(fila["fecha_vencimiento"]),
            )
            Insumo.objects.filter(pk=insumo.pk).update(creado_en=fila["creado_en"])

        pedidos = {}
        for fila in datos["pedido"]:
            cliente = Cliente.objects.get(pk=fila["cliente_id"])
            pedido = Pedido.objects.create(
                id=fila["id"],
                granja=cliente.granja,
                cliente=cliente,
                fecha_pedido=_fecha(fila["fecha_pedido"]),
                estado=fila["estado"],
                total=fila["total"],
            )
            Pedido.objects.filter(pk=pedido.pk).update(creado_en=fila["creado_en"])
            pedidos[pedido.pk] = pedido

        for fila in datos["detalle_pedido"]:
            DetallePedido.objects.create(
                id=fila["id"],
                pedido=pedidos[fila["pedido_id"]],
                producto_id=fila["producto_id"],
                cantidad=fila["cantidad"],
                precio_unitario=fila["precio_unitario"],
            )

        for pedido_id, pedido in pedidos.items():
            total_original = next(
                f["total"] for f in datos["pedido"] if f["id"] == pedido_id
            )
            Pedido.objects.filter(pk=pedido.pk).update(total=total_original)

        for fila in datos["venta"]:
            pedido = pedidos[fila["pedido_id"]]
            venta = Venta.objects.create(
                id=fila["id"],
                granja=pedido.granja,
                pedido=pedido,
                fecha=_fecha(fila["fecha"]),
                monto_total=fila["monto_total"],
                forma_pago=fila["forma_pago"],
            )
            Venta.objects.filter(pk=venta.pk).update(creado_en=fila["creado_en"])

        for fila in datos["auditoria"]:
            auditoria = Auditoria.objects.create(
                id=fila["id"],
                granja=None,
                usuario_id=fila.get("usuario_id"),
                usuario_texto=fila["usuario_email"] or "",
                accion=_accion_legacy(fila["accion"]),
                modelo=fila["entidad"] or "",
                objeto_id=str(fila["entidad_id"] or ""),
                detalle=_detalle_json(fila["detalle"]),
            )
            Auditoria.objects.filter(pk=auditoria.pk).update(creado_en=fila["creado_en"])

        for fila in datos["configuracion_tienda"]:
            config = ConfiguracionTienda.objects.create(
                id=fila["id"],
                granja=granja_base,
                hero_titulo=fila["hero_titulo"] or "",
                hero_subtitulo=fila["hero_subtitulo"] or "",
                hero_cta_texto=fila["hero_cta_texto"] or "Hacer un pedido",
                hero_imagen_url=fila["hero_imagen_url"] or None,
                telefono_contacto=fila["telefono_contacto"] or "",
            )
            ConfiguracionTienda.objects.filter(pk=config.pk).update(
                actualizado_en=fila["actualizado_en"]
            )

        self._reajustar_secuencias()

        for granja in granjas.values():
            ConfiguracionTienda.objects.get_or_create(granja=granja)

        Almacen.objects.get_or_create(
            granja=granja_base, nombre="Almacén principal",
            defaults={"ubicacion": "", "activo": True},
        )

    # ------------------------------------------------------------------
    # Secuencias y verificación
    # ------------------------------------------------------------------
    def _reajustar_secuencias(self):
        tablas = [
            "granja", "rol", "usuario", "cliente", "galpon", "lote",
            "produccion", "producto", "insumo", "generacion_abono",
            "almacen", "movimiento_stock", "pedido", "detalle_pedido",
            "venta", "auditoria", "configuracion_tienda",
        ]
        with connection.cursor() as cursor:
            for tabla in tablas:
                cursor.execute(
                    "SELECT pg_get_serial_sequence(%s, 'id')", [tabla]
                )
                secuencia = cursor.fetchone()[0]
                if secuencia:
                    cursor.execute(
                        f'SELECT setval(%s, GREATEST(COALESCE((SELECT MAX(id) FROM "{tabla}"), 0) + 1, 1), false)',
                        [secuencia],
                    )

    def _verificar(self, datos):
        comprobaciones = [
            ("Granja", Granja), ("Rol", Rol), ("Usuario", Usuario),
            ("Cliente", Cliente), ("Galpon", Galpon), ("Lote", Lote),
            ("Produccion", Produccion), ("Producto", Producto),
            ("Insumo", Insumo), ("Pedido", Pedido),
            ("DetallePedido", DetallePedido), ("Venta", Venta),
            ("Auditoria", Auditoria),
        ]
        self.stdout.write("Verificación de filas migradas:")
        for nombre, modelo in comprobaciones:
            self.stdout.write(f"  {nombre}: {modelo.objects.count()}")
