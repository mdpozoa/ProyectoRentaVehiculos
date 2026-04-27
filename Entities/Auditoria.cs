using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("auditoria")]
    public class Auditoria : BaseModel
    {
        [PrimaryKey("id_auditoria", true)]
        [JsonPropertyName("ID_Auditoria")]
        public int IdAuditoria { get; set; }

        [Column("id_usuario")]
        [JsonPropertyName("ID_Usuario")]
        public int IdUsuario { get; set; }

        [Column("accion_auditoria")]
        [JsonPropertyName("Accion_Auditoria")]
        public string AccionAuditoria { get; set; } = string.Empty;

        [Column("fecha_auditoria")]
        [JsonPropertyName("Fecha_Auditoria")]
        public DateTime? FechaAuditoria { get; set; }
    }
}
