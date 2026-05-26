using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace Shared.Entities;

[Table("ciudad")]
public class Ciudad : BaseModel
{
    [PrimaryKey("id_ciudad", false)]
    [JsonPropertyName("ID_Ciudad")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdCiudad { get; set; }

    [Column("nombre_ciudad")] [JsonPropertyName("Nombre_Ciudad")]
    public string NombreCiudad { get; set; } = string.Empty;

    [Column("provincia_ciudad")] [JsonPropertyName("Provincia_Ciudad")]
    public string ProvinciaCiudad { get; set; } = string.Empty;
}

[Table("marca")]
public class Marca : BaseModel
{
    [PrimaryKey("id_marca", false)]
    [JsonPropertyName("ID_Marca")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdMarca { get; set; }

    [Column("nombre_marca")] [JsonPropertyName("Nombre_Marca")]
    public string NombreMarca { get; set; } = string.Empty;
}

[Table("modelo")]
public class Modelo : BaseModel
{
    [PrimaryKey("id_modelo", false)]
    [JsonPropertyName("ID_Modelo")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdModelo { get; set; }

    [Column("id_marca")] [JsonPropertyName("ID_Marca")]
    public int IdMarca { get; set; }

    [Column("nombre_modelo")] [JsonPropertyName("Nombre_Modelo")]
    public string NombreModelo { get; set; } = string.Empty;

    [Column("tipo_transmision")] [JsonPropertyName("Tipo_Transmision")]
    public string TipoTransmision { get; set; } = string.Empty;
}

[Table("categoria")]
public class Categoria : BaseModel
{
    [PrimaryKey("id_categoria", false)]
    [JsonPropertyName("ID_Categoria")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdCategoria { get; set; }

    [Column("nombre_categoria")] [JsonPropertyName("Nombre_Categoria")]
    public string NombreCategoria { get; set; } = string.Empty;

    [Column("descripcion_categoria")] [JsonPropertyName("Descripcion_Categoria")]
    public string DescripcionCategoria { get; set; } = string.Empty;
}

[Table("agencia")]
public class Agencia : BaseModel
{
    [PrimaryKey("id_agencia", false)]
    [JsonPropertyName("ID_Agencia")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdAgencia { get; set; }

    [Column("id_ciudad")] [JsonPropertyName("ID_Ciudad")]
    public int IdCiudad { get; set; }

    [Column("nombre_agencia")] [JsonPropertyName("Nombre_Agencia")]
    public string NombreAgencia { get; set; } = string.Empty;

    [Column("direccion_agencia")] [JsonPropertyName("Direccion_Agencia")]
    public string DireccionAgencia { get; set; } = string.Empty;

    [Column("telefono_agencia")] [JsonPropertyName("Telefono_Agencia")]
    public string TelefonoAgencia { get; set; } = string.Empty;
}

[Table("tarifa")]
public class Tarifa : BaseModel
{
    [PrimaryKey("id_tarifa", false)]
    [JsonPropertyName("ID_Tarifa")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdTarifa { get; set; }

    [Column("id_categoria")] [JsonPropertyName("ID_Categoria")]
    public int IdCategoria { get; set; }

    [Column("v_diario_tarifa")] [JsonPropertyName("V_Diario_Tarifa")]
    public decimal VDiarioTarifa { get; set; }

    [Column("v_seguro_tarifa")] [JsonPropertyName("V_Seguro_Tarifa")]
    public decimal VSeguroTarifa { get; set; }

    [Column("fv_inicio_tarifa")] [JsonPropertyName("FV_Inicio_Tarifa")]
    public DateTime FVInicioTarifa { get; set; }

    [Column("fv_final_tarifa")] [JsonPropertyName("FV_Final_Tarifa")]
    public DateTime? FVFinalTarifa { get; set; }
}

[Table("kardex")]
public class Kardex : BaseModel
{
    [PrimaryKey("id_kardex", false)]
    [JsonPropertyName("ID_Kardex")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdKardex { get; set; }

    [Column("id_vehiculo")] [JsonPropertyName("ID_Vehiculo")]
    public int IdVehiculo { get; set; }

    [Column("fecha_movimiento_kardex")] [JsonPropertyName("Fecha_Movimiento_Kardex")]
    public DateTime FechaMovimientoKardex { get; set; }

    [Column("tipo_movimiento_kardex")] [JsonPropertyName("Tipo_Movimiento_Kardex")]
    public string TipoMovimientoKardex { get; set; } = string.Empty;

    [Column("kilometraje_kardex")] [JsonPropertyName("Kilometraje_Kardex")]
    public decimal KilometrajeKardex { get; set; }

    [Column("observaciones_kardex")] [JsonPropertyName("Observaciones_Kardex")]
    public string ObservacionesKardex { get; set; } = string.Empty;
}
