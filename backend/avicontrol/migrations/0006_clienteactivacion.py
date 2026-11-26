from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("avicontrol", "0005_detalleventagallinaza_entradagallinaza_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ClienteActivacion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo_hash", models.CharField(max_length=255)),
                ("intentos", models.PositiveSmallIntegerField(default=0)),
                ("creado_en", models.DateTimeField(auto_now_add=True)),
                ("expira_en", models.DateTimeField()),
                ("usado_en", models.DateTimeField(blank=True, null=True)),
                (
                    "cliente",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="activaciones_login",
                        to="avicontrol.cliente",
                    ),
                ),
            ],
            options={"db_table": "cliente_activacion", "ordering": ["-creado_en"]},
        ),
    ]
