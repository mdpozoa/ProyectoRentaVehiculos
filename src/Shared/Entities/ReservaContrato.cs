using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace Shared.Entities;

[Table("reserva")]
public class Reserva : BaseModel
{
    [PrimaryKey("id_reserva", false)]
    [JsonPropertyName("ID_Reserva")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdReserva { get; set; }

    [Column("id_usuario")] [JsonPropertyName("ID_Usuario")]
    public int? IdUsuario { get; set; }

    [Column("id_vehiculo")] [JsonPropertyName("ID_Vehiculo")]
    public int? IdVehiculo { get; set; }

    [Column("id_agencia")] [JsonPropertyName("ID_Agencia")]
    public int? IdAgencia { get; set; }

    [Column("fecha_reserva")] [JsonPropertyName("Fecha_Reserva")]
    public DateTime? FechaReserva { get; set; }

    [Column("f_inicio_reserva")] [JsonPropertyName("F_Inicio_Reserva")]
    public DateTime? FInicioReserva { get; set; }

    [Column("f_final_reserva")] [JsonPropertyName("F_Final_Reserva")]
    public DateTime? FFinalReserva { get; set; }

    [Column("estado_reserva")] [JsonPropertyName("Estado_Reserva")]
    public string EstadoReserva { get; set; } = "Pendiente";
}

[Table("contrato")]
public class Contrato : BaseModel
{
    [PrimaryKey("id_contrato", false)]
    [JsonPropertyName("ID_Contrato")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdContrato { get; set; }

    [Column("id_reserva")] [JsonPropertyName("ID_Reserva")]
    public int IdReserva { get; set; }

    [Column("ter_con_contrato")] [JsonPropertyName("Ter_Con_Contrato")]
    public string TerConContrato { get; set; } = string.Empty;

    [Column("firma_contrato")] [JsonPropertyName("Firma_Contrato")]
    public string FirmaContrato { get; set; } = string.Empty;
}

[Table("siniestro")]
public class Siniestro : BaseModel
{
    [PrimaryKey("id_siniestro", false)]
    [JsonPropertyName("ID_Siniestro")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdSiniestro { get; set; }

    [Column("id_reserva")] [JsonPropertyName("ID_Reserva")]
    public int IdReserva { get; set; }

    [Column("id_vehiculo")] [JsonPropertyName("ID_Vehiculo")]
    public int IdVehiculo { get; set; }

    [Column("fecha_siniestro")] [JsonPropertyName("Fecha_Siniestro")]
    public DateTime FechaSiniestro { get; set; }

    [Column("tipo_siniestro")] [JsonPropertyName("Tipo_Siniestro")]
    public string TipoSiniestro { get; set; } = string.Empty;

    [Column("descripcion_siniestro")] [JsonPropertyName("Descripcion_Siniestro")]
    public string DescripcionSiniestro { get; set; } = string.Empty;

    [Column("monto_estimado")] [JsonPropertyName("Monto_Estimado")]
    public decimal MontoEstimado { get; set; }

    [Column("costo_siniestro")] [JsonPropertyName("Costo_Siniestro")]
    public decimal? CostoSiniestro { get; set; }
}
