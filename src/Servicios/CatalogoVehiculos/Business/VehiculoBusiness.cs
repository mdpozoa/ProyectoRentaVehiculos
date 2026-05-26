using Shared.Entities;
using Shared.DTOs;
using Shared.Helpers;
using CatalogoVehiculos.DataAccess;

namespace CatalogoVehiculos.Business;

public class VehiculoBusiness(VehiculoDA vehiculoDA, CatalogoDA cataloGoDA)
{
    /// <summary>Builds an enriched VehiculoDto by loading related modelo, marca, categoria.</summary>
    private async Task<VehiculoDto> ToDto(Vehiculo v)
    {
        var modelo    = await cataloGoDA.GetModeloById(v.IdModelo);
        var marca     = modelo != null ? await cataloGoDA.GetMarcaById(modelo.IdMarca) : null;
        var categoria = await cataloGoDA.GetCategoriaById(v.IdCategoria);
        var tarifa    = await cataloGoDA.GetTarifaByCategoria(v.IdCategoria);

        return new VehiculoDto
        {
            Id           = v.IdVehiculo.ToString()!,
            Nombre       = $"{marca?.NombreMarca ?? "?"} {modelo?.NombreModelo ?? "?"}",
            Descripcion  = $"{v.AnioVehiculo} · {v.ColorVehiculo} · {v.CombustibleVehiculo} · {modelo?.TipoTransmision}",
            PrecioPorDia = tarifa?.VDiarioTarifa ?? 0,
            Moneda       = "USD",
            Categoria    = categoria?.NombreCategoria ?? "Sin categoría",
            Disponible   = v.EstadoVehiculo == "Disponible",
            Placa        = v.PlacaVehiculo,
            Anio         = v.AnioVehiculo,
            Color        = v.ColorVehiculo,
            Combustible  = v.CombustibleVehiculo,
            Kilometraje  = v.KilometrajeVehiculo,
            Transmision  = modelo?.TipoTransmision,
            Marca        = marca?.NombreMarca,
            AgenciaId    = v.IdAgenciaActual
        };
    }

    public async Task<List<VehiculoDto>> GetVehiculos(int page, int pageSize,
        string? search, string? categoria, bool? disponible)
    {
        var all = await vehiculoDA.GetAllAsync();

        // Filtros en memoria (el cliente Supabase no soporta joins complejos fácilmente)
        if (disponible.HasValue)
            all = all.Where(v => (v.EstadoVehiculo == "Disponible") == disponible.Value).ToList();

        var dtos = new List<VehiculoDto>();
        foreach (var v in all)
        {
            var dto = await ToDto(v);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                if (!dto.Nombre.ToLower().Contains(term) && !dto.Descripcion.ToLower().Contains(term))
                    continue;
            }
            if (!string.IsNullOrWhiteSpace(categoria) &&
                !dto.Categoria.Equals(categoria, StringComparison.OrdinalIgnoreCase))
                continue;

            dtos.Add(dto);
        }

        return dtos.Skip((page - 1) * pageSize).Take(pageSize).ToList();
    }

    public async Task<VehiculoDto?> GetById(int id)
    {
        var v = await vehiculoDA.GetByIdAsync(id);
        return v == null ? null : await ToDto(v);
    }

    /// <summary>Verifica si el vehículo está disponible en el rango dado.</summary>
    public async Task<DisponibilidadVehiculoDto> CheckDisponibilidad(int id, DateOnly inicio, DateOnly fin)
    {
        var v = await vehiculoDA.GetByIdAsync(id);
        if (v == null) throw new KeyNotFoundException($"Vehículo {id} no encontrado.");

        if (v.EstadoVehiculo == "Disponible")
            return new DisponibilidadVehiculoDto { Disponible = true, Mensaje = "El vehículo está disponible para las fechas solicitadas." };

        return new DisponibilidadVehiculoDto { Disponible = false, Mensaje = $"El vehículo no está disponible. Estado actual: {v.EstadoVehiculo}." };
    }

    public async Task<VehiculoDto?> CreateVehiculo(Vehiculo req)
    {
        if (req.AnioVehiculo < 1900 || req.AnioVehiculo > DateTime.Now.Year + 1)
            throw new ArgumentException($"Año inválido: {req.AnioVehiculo}");
        if (req.KilometrajeVehiculo < 0)
            throw new ArgumentException("El kilometraje no puede ser negativo.");

        req.ColorVehiculo        = ValidationsHelper.Capitalizar(req.ColorVehiculo);
        req.PlacaVehiculo        = req.PlacaVehiculo?.ToUpper() ?? string.Empty;
        req.CombustibleVehiculo  = ValidationsHelper.Capitalizar(req.CombustibleVehiculo);
        req.EstadoVehiculo       = "Disponible";
        req.FechaRegistro        = DateTime.UtcNow;

        var created = await vehiculoDA.CreateAsync(req);
        return created == null ? null : await ToDto(created);
    }

    public async Task<VehiculoDto?> UpdateVehiculo(Vehiculo req)
    {
        var updated = await vehiculoDA.UpdateAsync(req);
        return updated == null ? null : await ToDto(updated);
    }

    public async Task DeleteVehiculo(int id) => await vehiculoDA.DeleteAsync(id);

    public async Task ForceAvailability(int id)
    {
        var v = await vehiculoDA.GetByIdAsync(id);
        if (v != null)
        {
            v.EstadoVehiculo = "Disponible";
            await vehiculoDA.UpdateAsync(v);
        }
    }
}

public class CatalogoBusiness(CatalogoDA da)
{
    public Task<List<Marca>>     GetMarcas()               => da.GetMarcas();
    public Task<Marca?>          GetMarcaById(int id)       => da.GetMarcaById(id);
    public Task<Marca?>          CreateMarca(Marca e)       => da.CreateMarca(e);
    public Task<Marca?>          UpdateMarca(Marca e)       => da.UpdateMarca(e);
    public Task                  DeleteMarca(int id)        => da.DeleteMarca(id);

    public Task<List<Modelo>>    GetModelos()               => da.GetModelos();
    public Task<Modelo?>         GetModeloById(int id)      => da.GetModeloById(id);
    public Task<Modelo?>         CreateModelo(Modelo e)     => da.CreateModelo(e);
    public Task<Modelo?>         UpdateModelo(Modelo e)     => da.UpdateModelo(e);
    public Task                  DeleteModelo(int id)       => da.DeleteModelo(id);

    public Task<List<Categoria>> GetCategorias()            => da.GetCategorias();
    public Task<Categoria?>      GetCategoriaById(int id)   => da.GetCategoriaById(id);
    public Task<Categoria?>      CreateCategoria(Categoria e) => da.CreateCategoria(e);
    public Task<Categoria?>      UpdateCategoria(Categoria e) => da.UpdateCategoria(e);
    public Task                  DeleteCategoria(int id)    => da.DeleteCategoria(id);

    public Task<List<Agencia>>   GetAgencias()              => da.GetAgencias();
    public Task<Agencia?>        GetAgenciaById(int id)     => da.GetAgenciaById(id);
    public Task<Agencia?>        CreateAgencia(Agencia e)   => da.CreateAgencia(e);
    public Task<Agencia?>        UpdateAgencia(Agencia e)   => da.UpdateAgencia(e);
    public Task                  DeleteAgencia(int id)      => da.DeleteAgencia(id);

    public Task<List<Tarifa>>    GetTarifas()               => da.GetTarifas();
    public Task<Tarifa?>         GetTarifaById(int id)      => da.GetTarifaById(id);
    public Task<Tarifa?>         CreateTarifa(Tarifa e)     => da.CreateTarifa(e);
    public Task<Tarifa?>         UpdateTarifa(Tarifa e)     => da.UpdateTarifa(e);
    public Task                  DeleteTarifa(int id)       => da.DeleteTarifa(id);

    public Task<List<Ciudad>>    GetCiudades()              => da.GetCiudades();
    public Task<Ciudad?>         GetCiudadById(int id)      => da.GetCiudadById(id);
    public Task<Ciudad?>         CreateCiudad(Ciudad e)     => da.CreateCiudad(e);
    public Task<Ciudad?>         UpdateCiudad(Ciudad e)     => da.UpdateCiudad(e);
    public Task                  DeleteCiudad(int id)       => da.DeleteCiudad(id);

    public Task<List<Kardex>>    GetKardex()                => da.GetKardex();
    public Task<List<Kardex>>    GetKardexByVehiculo(int id) => da.GetKardexByVehiculo(id);
    public Task<Kardex?>         CreateKardex(Kardex e)     => da.CreateKardex(e);
}
