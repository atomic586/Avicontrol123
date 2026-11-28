from django.db import migrations


ROLES_NUEVOS = [
    ("encargado_sanidad", "Encargado de Sanidad", "Gestiona vacunas, tratamientos y bioseguridad."),
]

MODULOS_DEFAULT = [
    "sanidad", "aves", "abono", "reportes_avanzados", "notificaciones",
]


def crear_rol_y_configs(apps, schema_editor):
    Rol = apps.get_model("avicontrol", "Rol")
    Granja = apps.get_model("avicontrol", "Granja")
    ConfiguracionGranja = apps.get_model("avicontrol", "ConfiguracionGranja")

    for codigo, nombre, descripcion in ROLES_NUEVOS:
        Rol.objects.get_or_create(
            codigo=codigo,
            defaults={"nombre": nombre, "descripcion": descripcion, "activo": True},
        )

    for granja in Granja.objects.all():
        ConfiguracionGranja.objects.get_or_create(
            granja=granja,
            defaults={"modulos_activos": list(MODULOS_DEFAULT)},
        )


def revertir(apps, schema_editor):
    Rol = apps.get_model("avicontrol", "Rol")
    Rol.objects.filter(codigo__in=[r[0] for r in ROLES_NUEVOS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("avicontrol", "0012_alter_rol_codigo_configuraciongranja"),
    ]
    operations = [
        migrations.RunPython(crear_rol_y_configs, revertir),
    ]