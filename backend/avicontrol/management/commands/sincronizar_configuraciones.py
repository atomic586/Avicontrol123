from django.core.management.base import BaseCommand
from avicontrol.models import Granja, ConfiguracionGranja
from avicontrol.modulos import MODULOS_DEFAULT


class Command(BaseCommand):
    help = "Crea ConfiguracionGranja para granjas existentes (idempotente)."

    def handle(self, *args, **options):
        creadas = 0
        for granja in Granja.objects.all():
            _, created = ConfiguracionGranja.objects.get_or_create(
                granja=granja,
                defaults={"modulos_activos": list(MODULOS_DEFAULT)},
            )
            if created:
                creadas += 1
        self.stdout.write(self.style.SUCCESS(
            f"Configuraciones creadas: {creadas}. Total granjas: {Granja.objects.count()}."
        ))