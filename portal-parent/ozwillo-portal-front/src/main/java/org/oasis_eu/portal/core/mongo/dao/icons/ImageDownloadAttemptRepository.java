package org.oasis_eu.portal.core.mongo.dao.icons;

import org.oasis_eu.portal.core.mongo.model.images.ImageDownloadAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * User: schambon
 * Date: 9/3/14
 */
public interface ImageDownloadAttemptRepository extends MongoRepository<ImageDownloadAttempt, String> {

	ImageDownloadAttempt findByUrl(String url);

}
