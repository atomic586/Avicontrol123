from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from avicontrol.models import (
    Cliente, Granja, Galpon, Lote, 
    Producto, Insumo, Produccion
)

class Command(BaseCommand):
    help = 'Poblar la base de datos con datos de prueba de AVICONTROL'

    def handle(self, *args, **kwargs):
        self.stdout.write('🐔 Iniciando carga de datos avícolas...')

        # ----------------------------------------
        # 1. CLIENTES
        # ----------------------------------------
        clientes_data = [
            {'nombres': 'Distribuidora', 'apellidos': 'El Huevo Feliz', 'dni': '1001', 'telefono': '77711111'},
            {'nombres': 'Panadería', 'apellidos': 'Doña Rosa', 'dni': '1002', 'telefono': '77722222'},
            {'nombres': 'Restaurante', 'apellidos': 'La Granja', 'dni': '1003', 'telefono': '77733333'},
            {'nombres': 'Mercado Central', 'apellidos': 'Puesto 45', 'dni': '1004', 'telefono': '77744444'},
            {'nombres': 'Supermercado', 'apellidos': 'El Ahorro', 'dni': '1005', 'telefono': '77755555'},
        ]
        for c in clientes_data:
            Cliente.objects.get_or_create(dni=c['dni'], defaults=c)
        self.stdout.write(f'✅ Clientes cargados: {Cliente.objects.count()}')

        # ----------------------------------------
        # 2. GRANJAS Y GALPONES
        # ----------------------------------------
        granja1, _ = Granja.objects.get_or_create(
            nombre='Granja Central AVICONTROL',
            defaults={'ubicacion': 'Km 12 Carretera Norte', 'telefono': '3334444'}
        )
        granja2, _ = Granja.objects.get_or_create(
            nombre='Granja Santa Rita',
            defaults={'ubicacion': 'Valle de Toluca', 'telefono': '3335555'}
        )

        galpon1, _ = Galpon.objects.get_or_create(
            granja=granja1, codigo='G-01', defaults={'capacidad_aves': 5000}
        )
        galpon2, _ = Galpon.objects.get_or_create(
            granja=granja1, codigo='G-02', defaults={'capacidad_aves': 5000}
        )
        galpon3, _ = Galpon.objects.get_or_create(
            granja=granja2, codigo='SR-01', defaults={'capacidad_aves': 3000}
        )
        self.stdout.write(f'✅ Galpones cargados: {Galpon.objects.count()}')

        # ----------------------------------------
        # 3. LOTES
        # ----------------------------------------
        hoy = timezone.now().date()
        lote1, _ = Lote.objects.get_or_create(
            codigo='LOTE-2025-01',
            defaults={
                'galpon': galpon1,
                'raza': 'Hy-Line Brown',
                'fecha_ingreso': hoy - timedelta(days=90),
                'cantidad_aves': 4800,
                'estado': 'activo'
            }
        )
        lote2, _ = Lote.objects.get_or_create(
            codigo='LOTE-2025-02',
            defaults={
                'galpon': galpon2,
                'raza': 'Lohmann Brown',
                'fecha_ingreso': hoy - timedelta(days=60),
                'cantidad_aves': 4900,
                'estado': 'activo'
            }
        )
        self.stdout.write(f'✅ Lotes cargados: {Lote.objects.count()}')

        # ----------------------------------------
        # 4. PRODUCCIÓN (Últimos 3 días)
        # ----------------------------------------
        for i in range(3):
            fecha = hoy - timedelta(days=i)
            Produccion.objects.get_or_create(
                lote=lote1, fecha=fecha,
                defaults={
                    'huevos_primera': 4200,
                    'huevos_segunda': 300,
                    'huevos_tercera': 100,
                    'huevos_descartados': 20
                }
            )
            Produccion.objects.get_or_create(
                lote=lote2, fecha=fecha,
                defaults={
                    'huevos_primera': 4500,
                    'huevos_segunda': 200,
                    'huevos_tercera': 50,
                    'huevos_descartados': 15
                }
            )
        self.stdout.write(f'✅ Registros de producción cargados: {Produccion.objects.count()}')

        # ----------------------------------------
        # 5. PRODUCTOS
        # ----------------------------------------
        productos_data = [
            {'nombre': 'Huevo de Primera', 'presentacion': 'maple', 'categoria': 'primera', 'precio_unitario': Decimal('25.00'), 'stock': 500, 'stock_minimo': 50},
            {'nombre': 'Huevo de Primera', 'presentacion': 'caja', 'categoria': 'primera', 'precio_unitario': Decimal('280.00'), 'stock': 50, 'stock_minimo': 10},
            {'nombre': 'Huevo de Segunda', 'presentacion': 'maple', 'categoria': 'segunda', 'precio_unitario': Decimal('20.00'), 'stock': 300, 'stock_minimo': 30},
            {'nombre': 'Huevo de Tercera', 'presentacion': 'bandeja', 'categoria': 'tercera', 'precio_unitario': Decimal('8.50'), 'stock': 200, 'stock_minimo': 20},
        ]
        for p in productos_data:
            Producto.objects.get_or_create(
                nombre=p['nombre'], presentacion=p['presentacion'], 
                defaults=p
            )
        self.stdout.write(f'✅ Productos cargados: {Producto.objects.count()}')

        # ----------------------------------------
        # 6. INSUMOS
        # ----------------------------------------
        insumos_data = [
            {'nombre': 'Alimento balanceado ponedora', 'tipo': 'alimento', 'presentacion': 'Bulto 40kg', 'stock': 100, 'stock_minimo': 20, 'precio_unitario': Decimal('120.00'), 'fecha_vencimiento': hoy + timedelta(days=60)},
            {'nombre': 'Vacuna Newcastle', 'tipo': 'vacuna', 'presentacion': 'Frasco 100 dosis', 'stock': 5, 'stock_minimo': 10, 'precio_unitario': Decimal('85.00'), 'fecha_vencimiento': hoy + timedelta(days=15)},
            {'nombre': 'Vitamina ADE', 'tipo': 'vitamina', 'presentacion': 'Frasco 500ml', 'stock': 8, 'stock_minimo': 5, 'precio_unitario': Decimal('45.00'), 'fecha_vencimiento': hoy + timedelta(days=90)},
            {'nombre': 'Calcio en polvo', 'tipo': 'alimento', 'presentacion': 'Bolsa 10kg', 'stock': 30, 'stock_minimo': 10, 'precio_unitario': Decimal('60.00'), 'fecha_vencimiento': hoy + timedelta(days=180)},
        ]
        for i in insumos_data:
            Insumo.objects.get_or_create(nombre=i['nombre'], defaults=i)
        self.stdout.write(f'✅ Insumos cargados: {Insumo.objects.count()}')

        self.stdout.write(self.style.SUCCESS('🎉 ¡Datos avícolas cargados con éxito!'))