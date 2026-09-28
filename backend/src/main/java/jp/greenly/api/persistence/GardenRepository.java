package jp.greenly.api.persistence;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GardenRepository extends JpaRepository<GardenEntity, String> {
  List<GardenEntity> findAllByOwnerIdOrderByUpdatedAtDesc(String ownerId);

  Optional<GardenEntity> findByIdAndOwnerId(String id, String ownerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select garden from GardenEntity garden where garden.id = :id and garden.ownerId = :ownerId")
  Optional<GardenEntity> findByIdAndOwnerIdForUpdate(@Param("id") String id, @Param("ownerId") String ownerId);
}
