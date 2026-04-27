using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("reserva")]
    public class Reserva : BaseModel
    {
        [PrimaryKey("id_reserva", true)]
        [JsonPropertyName("ID_Reserva")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int IdReserva { get; set; }

        [Column("id_usuario")]
        [JsonPropertyName("ID_Usuario")]
        public int IdUsuario { get; set; }

        [Column("id_vehiculo")]
        [JsonPropertyName("ID_Vehiculo")]
        public int IdVehiculo { get; set; }

        [Column("id_agencia")]
        [JsonPropertyName("ID_Agencia")]
        public int IdAgencia { get; set; }

        [Column("fecha_reserva")]
        [JsonPropertyName("Fecha_Reserva")]
        public DateTime? FechaReserva { get; set; }

        [Column("f_inicio_reserva")]
        [JsonPropertyName("F_Inicio_Reserva")]
        public DateTime FInicioReserva { get; set; }

        [Column("f_final_reserva")]
        [JsonPropertyName("F_Final_Reserva")]
        public DateTime FFinalReserva { get; set; }

        [Column("estado_reserva")]
        [JsonPropertyName("Estado_Reserva")]
        public string EstadoReserva { get; set; } = string.Empty;
    }
}
