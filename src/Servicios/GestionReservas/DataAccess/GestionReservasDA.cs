using Supabase;
using Shared.Entities;

namespace GestionReservas.DataAccess;

public class ReservaDA(Client supabase)
{
    public async Task<List<Reserva>> GetAll()                         { var r = await supabase.From<Reserva>().Get(); return r.Models.ToList(); }
    public async Task<List<Reserva>> GetByUsuario(int idUsuario)      { var r = await supabase.From<Reserva>().Where(x => x.IdUsuario == (int?)idUsuario).Get(); return r.Models.ToList(); }
    public async Task<Reserva?> GetById(int id)                       { var r = await supabase.From<Reserva>().Where(x => x.IdReserva == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Reserva?> Create(Reserva req)                   { req.IdReserva = null; var r = await supabase.From<Reserva>().Insert(req); return r.Models.FirstOrDefault(); }
    public async Task<Reserva?> Update(Reserva req)                   { var r = await supabase.From<Reserva>().Update(req); return r.Models.FirstOrDefault(); }
    public async Task Delete(int id)                                  => await supabase.From<Reserva>().Where(x => x.IdReserva == (int?)id).Delete();

    public async Task<List<Contrato>> GetAllContratos()               { var r = await supabase.From<Contrato>().Get(); return r.Models.ToList(); }
    public async Task<Contrato?> GetContratoById(int id)              { var r = await supabase.From<Contrato>().Where(x => x.IdContrato == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Contrato?> GetContratoByReserva(int idReserva)  { var r = await supabase.From<Contrato>().Where(x => x.IdReserva == idReserva).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Contrato?> CreateContrato(Contrato c)           { c.IdContrato = null; await supabase.From<Contrato>().Insert(c); var r = await supabase.From<Contrato>().Where(x => x.IdReserva == c.IdReserva).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Contrato?> UpdateContrato(Contrato c)           { var r = await supabase.From<Contrato>().Update(c); return r.Models.FirstOrDefault(); }
    public async Task DeleteContrato(int id)                          => await supabase.From<Contrato>().Where(x => x.IdContrato == (int?)id).Delete();
}

public class PersonaDA(Client supabase)
{
    public async Task<List<Persona>> GetAll()                     { var r = await supabase.From<Persona>().Get(); return r.Models.ToList(); }
    public async Task<Persona?> GetById(int id)                   { var r = await supabase.From<Persona>().Where(x => x.IdPersona == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Persona?> GetByCedula(string cedula)        { var r = await supabase.From<Persona>().Where(x => x.CedulaPersona == cedula).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Persona?> Create(Persona p)                 { p.IdPersona = null; var r = await supabase.From<Persona>().Insert(p); return r.Models.FirstOrDefault(); }
    public async Task<Persona?> Update(Persona p)                 { var r = await supabase.From<Persona>().Update(p); return r.Models.FirstOrDefault(); }
    public async Task Delete(int id)                              => await supabase.From<Persona>().Where(x => x.IdPersona == (int?)id).Delete();
}

public class UsuarioDA(Client supabase)
{
    public async Task<List<Usuario>> GetAll()                     { var r = await supabase.From<Usuario>().Get(); return r.Models.ToList(); }
    public async Task<Usuario?> GetById(int id)                   { var r = await supabase.From<Usuario>().Where(x => x.IdUsuario == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Usuario?> GetByUsername(string username)    { var r = await supabase.From<Usuario>().Where(x => x.UserUsuario == username).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Usuario?> Create(Usuario u)                 { u.IdUsuario = null; var r = await supabase.From<Usuario>().Insert(u); return r.Models.FirstOrDefault(); }
    public async Task<Usuario?> Update(Usuario u)                 { var r = await supabase.From<Usuario>().Update(u); return r.Models.FirstOrDefault(); }
    public async Task Delete(int id)                              => await supabase.From<Usuario>().Where(x => x.IdUsuario == (int?)id).Delete();
}

public class AuthDA(Client supabase)
{
    public async Task<Usuario?> LoginAsync(string user, string pass)
    {
        var r = await supabase.From<Usuario>().Where(x => x.UserUsuario == user).Get();
        var usuario = r.Models.FirstOrDefault();
        if (usuario == null) return null;

        bool ok = false;
        try { ok = BCrypt.Net.BCrypt.Verify(pass, usuario.PassUsuario); }
        catch { ok = (pass == usuario.PassUsuario); }
        return ok ? usuario : null;
    }
}

public class SiniestroDA(Client supabase)
{
    public async Task<List<Siniestro>> GetAll()                   { var r = await supabase.From<Siniestro>().Get(); return r.Models.ToList(); }
    public async Task<Siniestro?> GetById(int id)                 { var r = await supabase.From<Siniestro>().Where(x => x.IdSiniestro == (int?)id).Get(); return r.Models.FirstOrDefault(); }
    public async Task<Siniestro?> Create(Siniestro s)             { s.IdSiniestro = null; var r = await supabase.From<Siniestro>().Insert(s); return r.Models.FirstOrDefault(); }
    public async Task<Siniestro?> Update(Siniestro s)             { var r = await supabase.From<Siniestro>().Update(s); return r.Models.FirstOrDefault(); }
    public async Task Delete(int id)                              => await supabase.From<Siniestro>().Where(x => x.IdSiniestro == (int?)id).Delete();
}
