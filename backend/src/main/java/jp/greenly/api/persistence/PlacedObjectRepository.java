package jp.greenly.api.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlacedObjectRepository extends JpaRepository<PlacedObjectEntity, String> {
  List<PlacedObjectEntity> findAllByGardenIdOrderByIdAsc(String gardenId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("delete from PlacedObjectEntity placed where placed.gardenId = :gardenId")
  void deleteAllByGardenId(@Param("gardenId") String gardenId);
}
